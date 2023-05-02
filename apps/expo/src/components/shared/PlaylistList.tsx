import { FC } from "react";
import { View } from "react-native";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { usePlayLists } from "@fissa/utils";

import { useAuth } from "../../providers";
import { EmptyState } from "./EmptyState";
import { PlaylistListItem } from "./PlaylistListItem";

export const PlaylistList: FC<Props> = ({
  onPlaylistPress,
  inverted,
  playlistListItemEnd,
  ...props
}) => {
  const { user } = useAuth();

  const playlists = usePlayLists(user);

  return (
    <View className="h-full w-full">
      <FlashList
        {...props}
        data={playlists}
        keyExtractor={({ id }) => id}
        estimatedItemSize={100}
        renderItem={({ item }) => (
          <PlaylistListItem
            className="px-6"
            playlist={item}
            onPress={() => onPlaylistPress?.(item)}
            end={playlistListItemEnd}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🐕"
            title="Fetching playlists"
            subtitle="good boy"
          />
        }
      />
    </View>
  );
};

interface Props
  extends Omit<
    FlashListProps<SpotifyApi.PlaylistObjectSimplified>,
    "renderItem" | "keyExtractor" | "data"
  > {
  onPlaylistPress?: (playlist: SpotifyApi.PlaylistObjectSimplified) => void;
  inverted?: boolean;
  playlistListItemEnd?: JSX.Element;
}
