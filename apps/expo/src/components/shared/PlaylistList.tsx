import { type FC } from "react";
import { View } from "react-native";
import { FlashList, type FlashListProps } from "@shopify/flash-list";
import { usePlayLists } from "@fissa/utils";

import { useAuth } from "../../providers";
import { EmptyState } from "./EmptyState";
import { PlaylistListItem } from "./PlaylistListItem";

export const PlaylistList: FC<Props> = ({
  onPlaylistPress,
  inverted,
  playlistListItemEnd,
  onlyUserPlaylists,
  ...props
}) => {
  const { user } = useAuth();

  const playlists = usePlayLists(user);

  return (
    <View className="h-full w-full">
      <FlashList
        {...props}
        data={playlists.filter(
          (playlists) => !onlyUserPlaylists || playlists.owner.id === user?.id,
        )}
        keyExtractor={({ id }) => id}
        estimatedItemSize={80}
        ItemSeparatorComponent={ItemSeparatorComponent}
        renderItem={({ item }) => (
          <PlaylistListItem
            className="px-6"
            inverted={inverted}
            playlist={item}
            onPress={() => onPlaylistPress?.(item)}
            end={playlistListItemEnd}
          />
        )}
        ListEmptyComponent={<EmptyState icon="🐕" title="Fetching playlists" subtitle="good boy" />}
      />
    </View>
  );
};

const ItemSeparatorComponent = () => <View className="h-6" />;

interface Props
  extends Omit<
    FlashListProps<SpotifyApi.PlaylistObjectSimplified>,
    "renderItem" | "keyExtractor" | "data"
  > {
  onPlaylistPress?: (playlist: SpotifyApi.PlaylistObjectSimplified) => void;
  inverted?: boolean;
  playlistListItemEnd?: JSX.Element;
  onlyUserPlaylists?: boolean;
}
