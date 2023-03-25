import { useMemo, useState } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { create } from "zustand";

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

    // TODO: fetch in loop for > than 50 tracks
    console.info(
      `Fetching ${uncachedTrackIds.length} tracks from Spotify API`,
      uncachedTrackIds,
    );
    const spotifyTracks = await new SpotifyWebApi().getTracks(uncachedTrackIds);

    spotifyStore.addTracks(spotifyTracks.tracks);

    const newTracks = trackIds
      ?.map((trackId) => {
        const track = spotifyStore.tracks.find((track) => track.id === trackId);
        if (track) return track;

        return spotifyTracks.tracks.find((track) => track.id === trackId);
      })
      .filter(Boolean);

    setTracks(() => newTracks ?? []);
  }, [trackIds, spotifyStore.addTracks, spotifyStore.tracks]);

  return tracks;
};
