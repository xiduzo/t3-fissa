import { useMemo } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { create } from "zustand";

import { splitInChunks } from "../array";

interface SpotifyState {
  tracks: SpotifyApi.TrackObjectFull[];
  addTracks: (tracks: SpotifyApi.TrackObjectFull[]) => void;
}

const useSpotifyStore = create<SpotifyState>((set) => ({
  tracks: [],
  addTracks: (tracks) =>
    set((state) => ({
      tracks: [
        ...state.tracks.filter(
          ({ id }) => !tracks.find((track) => track.id === id),
        ),
        ...tracks,
      ],
    })),
}));

export const useTracks = (trackIds?: string[]) => {
  const { addTracks, tracks } = useSpotifyStore();

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
      const { tracks } = await new SpotifyWebApi().getTracks(chunk);
      return tracks;
    });

    const tracks = (await Promise.all(promises)).flat();

    if (tracks.length) addTracks(tracks);
  }, [uncachedTrackIds, addTracks]);

  return requestedTracks;
};
