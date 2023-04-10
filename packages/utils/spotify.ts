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
  let offset = 0;

  do {
    const options = {
      offset,
      limit: 50,
      // fields:
      //   "items(track(id,name,artists(name),album(images(url)),type,is_local)),next",
    };

    const request =
      playlistId === SAVED_TRACKS_PLAYLIST_ID
        ? spotify.getMySavedTracks(options)
        : spotify.getPlaylistTracks(playlistId, options);

    const { next, items } = await request;

    offset += items.length;

    items.forEach(({ track }) => {
      const isTestTrack = track.name.toLowerCase().includes("hoe het");
      if (isTestTrack) console.log(JSON.stringify(track));
      if (track.type !== "track") return; // We can only allow tracks (not episodes
      if (track.is_local) return; // We can only allow tracks that are not local
      if (!track.album.available_markets?.length) return;

      // if (!track.is_playable) return; // We can only allow tracks that are playable
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

  do {
    const options = {
      offset,
      limit: 50,
      fields:
        "items(id,name,owner(display_name),images(url),tracks(total)),next",
    };

    const request = spotify.getUserPlaylists(user.id, options);

    const { next, items } = await request;

    offset += items.length;

    items.forEach((playlist) => playlists.push(playlist));

    updater && updater(playlists);

    hasNext = next !== null;
  } while (hasNext);

  try {
    const savedTracks = await spotify.getMySavedTracks(user.id);
    const playlist = savedTracksPlaylist(savedTracks.total, user.display_name);

    playlists.push(playlist);
  } catch {
    // Ignore
  }

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
