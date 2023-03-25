import { FC, useEffect, useState } from "react";
import { VirtualizedList, VirtualizedListProps } from "react-native";

import { useAuth } from "../../providers";
import EmptyState from "./EmptyState";
import { PlaylistListItem } from "./PlaylistListItem";

export const PlaylistList: FC<Props> = ({
  onPlaylistPress,
  inverted,
  ...props
}) => {
  const { user, spotify } = useAuth();

  const [playlists, setPlaylists] = useState<
    SpotifyApi.PlaylistObjectSimplified[]
  >([]);

  useEffect(() => {
    if (!user) return;

    spotify.getUserPlaylists(user.id).then((response) => {
      spotify
        .getMySavedTracks()
        .then((savedTracks) => {
          setPlaylists([
            {
              name: "Saved Tracks",
              id: "SAVED_TRACKS_PLAYLIST_ID",
              tracks: {
                total: savedTracks.total,
              },
              owner: {
                display_name: user.display_name,
              },
              images: [
                {
                  url: "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png",
                },
              ],
            } as any as SpotifyApi.PlaylistObjectFull,
            ...response.items,
          ]);
        })
        .catch(() => {
          setPlaylists(response.items);
        });
    });
  }, [user, spotify]);

  return (
    <VirtualizedList
      {...props}
      className="px-6"
      data={playlists}
      initialNumToRender={5}
      getItemCount={() => playlists.length}
      getItem={getItem}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => (
        <PlaylistListItem
          playlist={item}
          onPress={() => onPlaylistPress?.(item)}
        />
      )}
      ListEmptyComponent={
        <EmptyState icon="🐕" title="Fetching playlists" subtitle="good boy" />
      }
    />
  );
};

interface Props
  extends Omit<
    VirtualizedListProps<SpotifyApi.PlaylistObjectSimplified>,
    | "getItemCount"
    | "initialNumToRender"
    | "renderItem"
    | "getItem"
    | "keyExtractor"
  > {
  onPlaylistPress?: (playlist: SpotifyApi.PlaylistObjectSimplified) => void;
  inverted?: boolean;
}

const getItem = (data: SpotifyApi.PlaylistObjectSimplified[], index: number) =>
  data[index]!;
const keyExtractor = (
  track: SpotifyApi.PlaylistObjectSimplified,
  index: number,
) => track?.id ?? index;
