import { FC } from "react";
import { VirtualizedList, VirtualizedListProps } from "react-native";

import { ListItemProps } from "./ListItem";
import { TrackListItem } from "./TrackListItem";

interface Props
  extends Omit<
    VirtualizedListProps<SpotifyApi.TrackObjectFull>,
    | "getItemCount"
    | "initialNumToRender"
    | "renderItem"
    | "getItem"
    | "keyExtractor"
  > {
  tracks: SpotifyApi.TrackObjectFull[];
  selectedTracks?: SpotifyApi.TrackObjectFull["id"][];
  onTrackPress?: ListItemProps["onPress"];
}

export const TrackList: FC<Props> = ({
  tracks,
  onTrackPress,
  selectedTracks,
  ...props
}) => {
  return (
    <VirtualizedList
      {...props}
      className="px-6"
      data={tracks}
      getItemCount={() => tracks.length}
      initialNumToRender={5}
      renderItem={({ item }) => (
        <TrackListItem
          track={item}
          onPress={onTrackPress}
          selected={selectedTracks?.includes(item.id)}
        />
      )}
      getItem={getItem}
      keyExtractor={keyExtractor}
    />
  );
};

const getItem = (data: SpotifyApi.TrackObjectFull[], index: number) =>
  data[index]!;
const keyExtractor = (track: SpotifyApi.TrackObjectFull, index: number) =>
  track?.id ?? index;
