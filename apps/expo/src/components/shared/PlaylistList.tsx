import { FC } from "react";
import { VirtualizedList, VirtualizedListProps } from "react-native";
import { usePlayLists } from "@fissa/utils";

import { useAuth } from "../../providers";
import { EmptyState } from "./EmptyState";
import { PlaylistListItem } from "./PlaylistListItem";

export const PlaylistList: FC<Props> = ({
  onPlaylistPress,
  inverted,
  ...props
}) => {
  const { user, spotify } = useAuth();

  const playlists = usePlayLists(spotify, user);

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
