import { FC } from "react";
import { VirtualizedList, VirtualizedListProps } from "react-native";
import { usePlayLists, useSpotify } from "@fissa/utils";

import { useAuth } from "../../providers";
import { EmptyState } from "./EmptyState";
import { PlaylistListItem } from "./PlaylistListItem";

export const PlaylistList: FC<Props> = ({
  onPlaylistPress,
  inverted,
  playlistEnd,
  ...props
}) => {
  const { user } = useAuth();

  const playlists = usePlayLists(user);

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
          end={playlistEnd}
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
  playlistEnd?: JSX.Element;
}

const getItem = (data: SpotifyApi.PlaylistObjectSimplified[], index: number) =>
  data[index]!;
const keyExtractor = (
  track: SpotifyApi.PlaylistObjectSimplified,
  index: number,
) => track?.id ?? index;
