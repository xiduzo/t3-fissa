import SpotifyWebApi from "spotify-web-api-js";

export const getPlaylistTracks = async (
  playlistId: string,
  spotify: SpotifyWebApi.SpotifyWebApiJs,
  /**
   * When you'd like to update a state while fetching tracks
   */
  updater?: (tracks: SpotifyApi.TrackObjectFull[]) => void,
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

    items.forEach(({ track }) => {
      if (tracks.find(({ id }) => id === track.id)) return;
      tracks.push(track as SpotifyApi.TrackObjectFull);
    });

    updater && updater(tracks);

    hasNext = next !== null;
  } while (hasNext);

  return tracks;
};

export const getPlaylists = async (
  user: SpotifyApi.CurrentUsersProfileResponse,
  spotify: SpotifyWebApi.SpotifyWebApiJs,
  /**
   * When you'd like to update a state while fetching playlists
   */
  updater?: (playlists: SpotifyApi.PlaylistObjectSimplified[]) => void,
) => {
  const playlists: SpotifyApi.PlaylistObjectSimplified[] = [];
  let hasNext = false;

  do {
    const options = { limit: 50, offset: playlists.length };

    const request = spotify.getUserPlaylists(user.id, options);

    const { next, items } = await request;

    items.forEach((playlist) => playlists.push(playlist));

    updater && updater(playlists);

    hasNext = next !== null;
  } while (hasNext);

  try {
    const savedTracks = await spotify.getMySavedTracks(user.id);
    const playlist = savedTracksPlaylist(
      savedTracks.items.length,
      user.display_name,
    );

    playlists.push(playlist);
  } catch {
    // Ignore
  }

  return playlists;
};

const SAVED_TRACKS_PLAYLIST_ID = "SAVED_TRACKS_PLAYLIST_ID";

const savedTracksPlaylist = (total: number, display_name?: string) =>
  ({
    name: "Saved Tracks",
    id: "SAVED_TRACKS_PLAYLIST_ID",
    tracks: { total },
    owner: { display_name },
    images: [
      {
        url: "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png",
      },
    ],
  } as any as SpotifyApi.PlaylistObjectFull);
