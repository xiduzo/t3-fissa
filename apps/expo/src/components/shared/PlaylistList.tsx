import { FC, useEffect, useState } from "react";
import { VirtualizedList, VirtualizedListProps } from "react-native";
import { savedTracksPlaylist } from "@fissa/utils";

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

    spotify.getUserPlaylists(user.id).then(({ items }) => {
      setPlaylists(items);

      spotify.getMySavedTracks().then((savedTracks) => {
        setPlaylists([
          ...items,
          savedTracksPlaylist(savedTracks.items.length, user.display_name),
        ]);
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
