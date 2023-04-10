import { FC } from "react";
import {
  GestureResponderEvent,
  VirtualizedList,
  VirtualizedListProps,
} from "react-native";

import { Badge } from "./Badge";
import { TrackListItem } from "./TrackListItem";

export const TrackList: FC<Props> = ({
  tracks,
  onTrackPress,
  onTrackLongPress,
  selectedTracks,
  getTrackVotes,
  trackEnd,
  ...props
}) => {
  return (
    <VirtualizedList
      {...props}
      data={tracks}
      getItemCount={() => tracks.length}
      initialNumToRender={5}
      renderItem={({ item, index }) => (
        <TrackListItem
          className="px-6"
          key={item.id}
          index={index}
          track={item}
          subtitlePrefix={
            getTrackVotes && <Badge amount={getTrackVotes(item)} />
          }
          end={trackEnd && trackEnd(item)}
          onPress={() => onTrackPress?.(item)}
          onLongPress={onTrackLongPress?.(item)}
          selected={selectedTracks?.includes(item.id)}
        />
      )}
      getItem={getItem}
      keyExtractor={keyExtractor}
    />
  );
};

export type TrackListProps = Props;

interface Props
  extends Omit<
    VirtualizedListProps<SpotifyApi.TrackObjectFull>,
    | "getItemCount"
    | "initialNumToRender"
    | "getItem"
    | "keyExtractor"
    | "renderItem"
  > {
  tracks: SpotifyApi.TrackObjectFull[];
  selectedTracks?: string[];
  getTrackVotes?: (track: SpotifyApi.TrackObjectFull) => number;
  trackEnd?: (track: SpotifyApi.TrackObjectFull) => JSX.Element;
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
  onTrackLongPress?: (
    track: SpotifyApi.TrackObjectFull,
  ) => (event: GestureResponderEvent) => void;
}

const getItem = (data: SpotifyApi.TrackObjectFull[], index: number) =>
  data[index]!;
const keyExtractor = (track: SpotifyApi.TrackObjectFull, index: number) =>
  track?.id ?? index;
