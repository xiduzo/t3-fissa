import type SpotifyWebApi from "spotify-web-api-js";

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
  let offset = 0;

  do {
    const options = {
      offset,
      limit: 50,
      fields:
        "items(track(id,duration_ms,name,type,is_local,is_playable,artists(name),album(images(url)))),next",
    };

    const request =
      playlistId === SAVED_TRACKS_PLAYLIST_ID
        ? spotify.getMySavedTracks(options)
        : spotify.getPlaylistTracks(playlistId, options);

    const { next, items } = await request;

    offset += items.length;

    items.forEach(({ track }) => {
      if (track.type !== "track") return; // We can only allow tracks (not episodes
      if (track.is_local) return; // We can only allow tracks that are not local
      if (track.is_playable !== undefined && !track.is_playable) return; // We can only allow tracks that are playable
      // if (!track.preview_url) return; // We can only allow tracks that have a preview url
      if (tracks.find(({ id }) => id === track.id)) return;

      // if (!_track.available_markets?.length) return; // We can only allow tracks that are available in at least one market
      tracks.push(track);
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
  let offset = 0;

  // Sync so in the meantime we continue fetching playlists
  try {
    const { total } = await spotify.getMySavedTracks(user.id);
    const playlist = savedTracksPlaylist(total, { display_name: user.display_name, id: user.id });

    playlists.push(playlist);
  } catch {
    // We don't catch as we don't really care if it fails
  }

  do {
    const options = {
      offset,
      limit: 50,
      fields: "items(id,name,owner(id,display_name),images(url),tracks(total)),next",
    };

    const { next, items } = await spotify.getUserPlaylists(user.id, options);

    offset += items.length;

    items.forEach((playlist) => playlists.push(playlist));

    updater && updater(playlists);

    hasNext = next !== null;
  } while (hasNext);

  return playlists;
};

export const scopes = [
  // Read
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-top-read",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  // Modify
  "playlist-modify-public",
  "user-modify-playback-state",
  "user-library-modify",
];

export const SAVED_TRACKS_PLAYLIST_ID = "SAVED_TRACKS_PLAYLIST_ID";

const savedTracksPlaylist = (total: number, owner?: { display_name?: string; id: string }) =>
  ({
    name: "Liked songs",
    id: SAVED_TRACKS_PLAYLIST_ID,
    tracks: { total },
    owner,
    images: [
      {
        url: "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png",
      },
    ],
  } as unknown as SpotifyApi.PlaylistObjectFull);
