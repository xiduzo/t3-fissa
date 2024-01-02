import { useCallback, useEffect, useMemo } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { create } from "zustand";

import { splitInChunks } from "../array";
import { getPlaylists } from "../spotify";

interface SpotifyState {
  tracks: SpotifyApi.TrackObjectFull[];
  addTracks: (tracks: SpotifyApi.TrackObjectFull[]) => void;
  playLists: SpotifyApi.PlaylistObjectSimplified[];
  setPlayLists: (playLists: SpotifyApi.PlaylistObjectSimplified[]) => void;
  spotify: SpotifyWebApi.SpotifyWebApiJs;
  devices: SpotifyApi.UserDevice[];
  setDevices: (devices: SpotifyApi.UserDevice[]) => void;
}

const useSpotifyStore = create<SpotifyState>((set) => ({
  tracks: [],
  addTracks: (tracks) => set((state) => ({ tracks: newTracks(state.tracks, tracks) })),
  playLists: [],
  setPlayLists: (playLists) => set(() => ({ playLists })),
  spotify: new SpotifyWebApi(),
  devices: [],
  setDevices: (devices) => set(() => ({ devices })),
}));

const newTracks = (
  currentTracks: SpotifyApi.TrackObjectFull[],
  newTracks: SpotifyApi.TrackObjectFull[],
) => {
  const currentTrackIds = new Set(currentTracks.map(({ id }) => id));

  const mergedTracks = newTracks.filter(({ id }) => !currentTrackIds.has(id));

  return [...currentTracks, ...mergedTracks];
};

export const useTracks = (trackIds?: string[]) => {
  const { addTracks, tracks, spotify } = useSpotifyStore();

  const cachedTrackIds = useMemo(() => new Set(tracks.map(({ id }) => id)), [tracks]);

  const uncachedTrackIds = useMemo(
    () => trackIds?.filter((trackId) => !cachedTrackIds.has(trackId)) ?? [],
    [trackIds, cachedTrackIds],
  );

  const requestedTracks = useMemo(
    () => trackIds?.map((trackId) => tracks.find(({ id }) => id === trackId)).filter(Boolean) ?? [],
    [trackIds, tracks],
  );

  useEffect(() => {
    const promises = splitInChunks(uncachedTrackIds).map((chunk) => spotify.getTracks(chunk));

    void Promise.all(promises).then((response) => {
      const newTracks = response.map(({ tracks }) => tracks).flat();
      if (newTracks.length) addTracks(newTracks);
    });
  }, [uncachedTrackIds, addTracks, spotify]);

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

export const useDevices = () => {
  const { spotify, devices, setDevices } = useSpotifyStore();

  const fetchDevices = useCallback(() => {
    void spotify.getMyDevices().then(({ devices }) => setDevices(devices));
  }, [spotify, setDevices]);

  const activeDevice = useMemo(() => {
    return devices.find(({ is_active }) => is_active);
  }, [devices]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, activeDevice, fetchDevices };
};
