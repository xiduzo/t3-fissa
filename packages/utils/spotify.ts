import SpotifyWebApi from "spotify-web-api-js";

import { SAVED_TRACKS_PLAYLIST_ID } from "./constants";

export const getPlaylistTracks = async (
  playlistId: string,
  spotify = new SpotifyWebApi(),
) => {
  const tracks: SpotifyApi.TrackObjectFull[] = [];
  let hasNext = false;

  do {
    const options = {
      limit: 50,
      offset: tracks.length,
    };

    if (playlistId === SAVED_TRACKS_PLAYLIST_ID) {
      const { next, items } = await spotify.getMySavedTracks(options);

      items.forEach(({ track }) =>
        tracks.push(track as SpotifyApi.TrackObjectFull),
      );
      hasNext = next !== null;
    } else {
      const { next, items } = await spotify.getPlaylistTracks(
        playlistId,
        options,
      );

      items.forEach(({ track }) =>
        tracks.push(track as SpotifyApi.TrackObjectFull),
      );
      hasNext = next !== null;
    }
  } while (hasNext);

  // TODO return unique tracks even though the user has them added multiple times to their playlist
  return tracks;
};
