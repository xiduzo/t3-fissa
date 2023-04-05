import { useMemo } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { create } from "zustand";

import { splitInChunks } from "../array";
import { savedTracksPlaylist } from "../constants";

interface SpotifyState {
  tracks: SpotifyApi.TrackObjectFull[];
  addTracks: (tracks: SpotifyApi.TrackObjectFull[]) => void;
  playLists: SpotifyApi.PlaylistObjectSimplified[];
  setPlayLists: (playLists: SpotifyApi.PlaylistObjectSimplified[]) => void;
  spotify: SpotifyWebApi.SpotifyWebApiJs;
}

const useSpotifyStore = create<SpotifyState>((set) => ({
  tracks: [],
  addTracks: (tracks) =>
    set((state) => ({ tracks: newTracks(state.tracks, tracks) })),
  playLists: [],
  setPlayLists: (playLists) => set(() => ({ playLists })),
  spotify: new SpotifyWebApi(),
}));

const newTracks = (
  currentTracks: SpotifyApi.TrackObjectFull[],
  newTracks: SpotifyApi.TrackObjectFull[],
) => [
  ...currentTracks.filter(
    ({ id }) => !newTracks.find((track) => track.id === id),
  ),
  ...newTracks,
];

export const useTracks = (trackIds?: string[]) => {
  const { addTracks, tracks, spotify } = useSpotifyStore();

  const cachedTrackIds = useMemo(
    () => tracks.map(({ id }) => id),
    [trackIds, tracks],
  );

  const uncachedTrackIds = useMemo(() => {
    return (
      trackIds?.filter((trackId) => !cachedTrackIds.includes(trackId)) ?? []
    );
  }, [trackIds, cachedTrackIds]);

  const requestedTracks = useMemo(() => {
    return (
      trackIds
        ?.map((trackId) => tracks.find(({ id }) => id === trackId))
        .filter(Boolean) ?? []
    );
  }, [trackIds, tracks]);

  useMemo(async () => {
    const promises = splitInChunks(uncachedTrackIds).map(async (chunk) => {
      const { tracks } = await spotify.getTracks(chunk);
      return tracks;
    });

    const tracks = (await Promise.all(promises)).flat();

    if (tracks.length) addTracks(tracks);
  }, [uncachedTrackIds, addTracks, spotify]);

  return requestedTracks;
};

export const usePlayLists = (user?: SpotifyApi.CurrentUsersProfileResponse) => {
  const { setPlayLists, spotify } = useSpotifyStore();

  useMemo(async () => {
    const { items } = await spotify.getUserPlaylists(user?.id);

    try {
      const savedTracks = await spotify.getMySavedTracks(user?.id);
      setPlayLists([
        ...items,
        savedTracksPlaylist(savedTracks.items.length, user?.display_name),
      ]);
    } catch {
      setPlayLists(items);
    }
  }, [setPlayLists, user]);

  return useSpotifyStore((state) => state.playLists);
};

export const useSpotify = () => {
  const { spotify } = useSpotifyStore();
  return spotify;
};
