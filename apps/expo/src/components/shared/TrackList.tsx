import { FC } from "react";
import { VirtualizedList, VirtualizedListProps } from "react-native";

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
  selectedTracks?: string[];
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
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
          key={item.id}
          track={item}
          onPress={() => onTrackPress?.(item)}
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
