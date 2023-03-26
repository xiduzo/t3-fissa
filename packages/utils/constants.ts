export const SAVED_TRACKS_PLAYLIST_ID = "SAVED_TRACKS_PLAYLIST_ID";

export const savedTracksPlaylist = (total: number, display_name?: string) =>
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
