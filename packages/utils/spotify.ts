import SpotifyWebApi from "spotify-web-api-js";

import { SAVED_TRACKS_PLAYLIST_ID } from "./constants";

export const getPlaylistTracks = async (
  playlistId: string,
  spotify = new SpotifyWebApi(),
) => {
  const tracks: SpotifyApi.TrackObjectFull[] = [];
  let hasNext = false;

  do {
    const options = { limit: 50, offset: tracks.length };

    const request =
      playlistId === SAVED_TRACKS_PLAYLIST_ID
        ? spotify.getMySavedTracks(options)
        : spotify.getPlaylistTracks(playlistId, options);

    const { next, items } = await request;

    items.forEach(({ track }) =>
      tracks.push(track as SpotifyApi.TrackObjectFull),
    );

    hasNext = next !== null;
  } while (hasNext);

  return tracks.reduce((acc, next) => {
    if (acc.find(({ id }) => id === next.id)) return acc;

    return [...acc, next];
  }, [] as SpotifyApi.TrackObjectFull[]);
};
