import { useMemo, useState } from "react";
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
    set((state) => ({ tracks: [...state.tracks, ...tracks] })),
}));

export const useTracks = (trackIds?: string[]) => {
  const spotifyStore = useSpotifyStore();

  const cachedTracks = trackIds
    ? spotifyStore.tracks.filter((track) => trackIds.includes(track.id))
    : [];

  const [tracks, setTracks] =
    useState<SpotifyApi.TrackObjectFull[]>(cachedTracks);

  useMemo(async () => {
    const uncachedTrackIds =
      trackIds?.filter(
        (trackId) => !cachedTracks.map((track) => track.id).includes(trackId),
      ) ?? [];

    if (uncachedTrackIds.length === 0) return;

    const promises = splitInChunks(uncachedTrackIds).map(async (chunk) => {
      const { tracks } = await new SpotifyWebApi().getTracks(chunk);
      return tracks;
    });

    const tracks = (await Promise.all(promises)).flat();

    spotifyStore.addTracks(tracks);

    const newTracks =
      trackIds
        ?.map((trackId) => {
          const track = spotifyStore.tracks.find(({ id }) => id === trackId);
          if (track) return track;

          return tracks.find(({ id }) => id === trackId);
        })
        .filter(Boolean) ?? [];

    setTracks(() => newTracks);
  }, [trackIds, spotifyStore.addTracks, spotifyStore.tracks]);

  return tracks;
};
