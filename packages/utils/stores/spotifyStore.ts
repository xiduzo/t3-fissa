import { useCallback, useEffect, useMemo, useRef } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { useShallow } from "zustand/shallow";

import { splitInChunks } from "../array";
import { getPlaylists } from "../spotify";

/** Tracks older than 7 days without use get evicted on next hydration. */
const TRACK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedTrack {
  track: SpotifyApi.TrackObjectFull;
  lastUsed: number; // epoch ms
}

interface PersistedState {
  cachedTracks: CachedTrack[];
  playLists: SpotifyApi.PlaylistObjectSimplified[];
}

interface SpotifyState extends PersistedState {
  addTracks: (tracks: SpotifyApi.TrackObjectFull[]) => void;
  updateTracks: (tracks: SpotifyApi.TrackObjectFull[]) => void;
  touchTracks: (trackIds: string[]) => void;
  setPlayLists: (playLists: SpotifyApi.PlaylistObjectSimplified[]) => void;
  spotify: SpotifyWebApi.SpotifyWebApiJs;
  devices: SpotifyApi.UserDevice[];
  setDevices: (devices: SpotifyApi.UserDevice[]) => void;
}

/**
 * Holds the storage backend injected by the consumer app.
 * Falls back to a no-op storage so the store works without persistence
 * (e.g. in tests or non-RN environments).
 */
let _storage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Call once at app startup (before the store hydrates) to wire up
 * the persistence backend. In Expo, pass AsyncStorage.
 *
 * @example
 * ```ts
 * import AsyncStorage from "@react-native-async-storage/async-storage";
 * import { initSpotifyPersistence } from "@fissa/utils";
 * initSpotifyPersistence(AsyncStorage);
 * ```
 */
export const initSpotifyPersistence = (storage: StateStorage) => {
  _storage = storage;
};

const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set) => ({
      cachedTracks: [],
      addTracks: (tracks) =>
        set((state) => {
          const now = Date.now();
          const existingIds = new Set(state.cachedTracks.map((ct) => ct.track.id));
          const fresh = tracks
            .filter(({ id }) => !existingIds.has(id))
            .map((track) => ({ track, lastUsed: now }));
          return { cachedTracks: [...state.cachedTracks, ...fresh] };
        }),
      updateTracks: (tracks) =>
        set((state) => {
          const now = Date.now();
          const updatedMap = new Map(tracks.map((t) => [t.id, t]));
          const updated = state.cachedTracks.map((ct) => {
            const fresh = updatedMap.get(ct.track.id);
            return fresh ? { track: fresh, lastUsed: now } : ct;
          });
          const existingIds = new Set(state.cachedTracks.map((ct) => ct.track.id));
          const brandNew = tracks
            .filter(({ id }) => !existingIds.has(id))
            .map((track) => ({ track, lastUsed: now }));
          return { cachedTracks: [...updated, ...brandNew] };
        }),
      touchTracks: (trackIds) =>
        set((state) => {
          const idsToTouch = new Set(trackIds);
          const now = Date.now();
          return {
            cachedTracks: state.cachedTracks.map((ct) =>
              idsToTouch.has(ct.track.id) ? { ...ct, lastUsed: now } : ct,
            ),
          };
        }),
      playLists: [],
      setPlayLists: (playLists) => set(() => ({ playLists })),
      spotify: new SpotifyWebApi(),
      devices: [],
      setDevices: (devices) => set(() => ({ devices })),
    }),
    {
      name: "spotify-cache",
      storage: createJSONStorage(() => _storage),
      partialize: (state): PersistedState => ({
        cachedTracks: state.cachedTracks,
        playLists: state.playLists,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Evict stale tracks on startup
        const cutoff = Date.now() - TRACK_TTL_MS;
        state.cachedTracks = state.cachedTracks.filter((ct) => ct.lastUsed > cutoff);
      },
    },
  ),
);

export const useTracks = (trackIds?: string[]) => {
  const spotify = useSpotifyStore((s) => s.spotify);
  const addTracks = useSpotifyStore((s) => s.addTracks);
  const updateTracks = useSpotifyStore((s) => s.updateTracks);
  const touchTracks = useSpotifyStore((s) => s.touchTracks);

  // Stable key — only changes when the actual set of IDs changes
  const trackIdKey = useMemo(
    () => (trackIds ? [...trackIds].sort().join(",") : ""),
    [trackIds],
  );

  // Grab only the track objects we care about, with shallow equality
  const requestedTracks = useSpotifyStore(
    useShallow((state) => {
      if (!trackIds?.length) return [];
      const map = new Map(state.cachedTracks.map((ct) => [ct.track.id, ct.track]));
      return trackIds
        .map((id) => map.get(id))
        .filter((t): t is SpotifyApi.TrackObjectFull => !!t);
    }),
  );

  // Touch timestamps — fire once per unique set of IDs
  const touchedRef = useRef("");
  useEffect(() => {
    if (!trackIds?.length || trackIdKey === touchedRef.current) return;
    touchedRef.current = trackIdKey;
    touchTracks(trackIds);
  }, [trackIdKey, trackIds, touchTracks]);

  // Fetch uncached tracks immediately
  const fetchedRef = useRef("");
  useEffect(() => {
    if (!trackIds?.length || trackIdKey === fetchedRef.current) return;
    fetchedRef.current = trackIdKey;

    // Snapshot current cache to figure out what's missing
    const cached = new Set(
      useSpotifyStore.getState().cachedTracks.map((ct) => ct.track.id),
    );
    const missing = trackIds.filter((id) => !cached.has(id));
    if (!missing.length) return;

    const promises = splitInChunks(missing).map((chunk) => spotify.getTracks(chunk));
    void Promise.all(promises).then((response) => {
      const newTracks = response.flatMap(({ tracks }) => tracks);
      if (newTracks.length) addTracks(newTracks);
    });
  }, [trackIdKey, trackIds, addTracks, spotify]);

  // Background revalidation — runs once per unique set of trackIds
  const revalidatedRef = useRef("");
  useEffect(() => {
    if (!trackIds?.length || trackIdKey === revalidatedRef.current) return;
    revalidatedRef.current = trackIdKey;

    const promises = splitInChunks(trackIds).map((chunk) => spotify.getTracks(chunk));
    void Promise.all(promises).then((response) => {
      const freshTracks = response.flatMap(({ tracks }) => tracks);
      if (freshTracks.length) updateTracks(freshTracks);
    });
  }, [trackIdKey, trackIds, updateTracks, spotify]);

  return requestedTracks;
};

export const usePlayLists = (user?: SpotifyApi.CurrentUsersProfileResponse) => {
  const { setPlayLists, spotify } = useSpotifyStore();

  useEffect(() => {
    if (!user) return;
    void getPlaylists(user, spotify, setPlayLists);
  }, [setPlayLists, user, spotify]);

  return useSpotifyStore((state) => state.playLists);
};

export const useSpotify = () => {
  const { spotify } = useSpotifyStore();
  return spotify;
};

export const useDevices = (autoFetch: boolean) => {
  const { spotify, devices, setDevices } = useSpotifyStore();

  const fetchDevices = useCallback(() => {
    void spotify.getMyDevices().then(({ devices }) => setDevices(devices));
  }, [spotify, setDevices]);

  const activeDevice = devices.find(({ is_active }) => is_active);

  useEffect(() => {
    if (!autoFetch) return;

    fetchDevices();
  }, [fetchDevices, autoFetch]);

  return { devices, activeDevice, fetchDevices };
};
