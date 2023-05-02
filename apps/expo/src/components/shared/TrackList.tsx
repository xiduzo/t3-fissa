import { FC } from "react";
import { GestureResponderEvent, View } from "react-native";
import { FlashList, FlashListProps } from "@shopify/flash-list";

import { Badge } from "./Badge";
import { TrackListItem } from "./TrackListItem";

export const TrackList: FC<Props> = ({
  onTrackPress,
  onTrackLongPress,
  selectedTracks,
  getTrackVotes,
  trackEnd,
  ...props
}) => {
  return (
    <View className="h-full w-full">
      <FlashList
        {...props}
        estimatedItemSize={100}
        keyExtractor={({ id }) => id}
        extraData={selectedTracks}
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
      />
    </View>
  );
};

export type TrackListProps = Props;

interface Props
  extends Omit<
    FlashListProps<SpotifyApi.TrackObjectFull>,
    "keyExtractor" | "renderItem"
  > {
  selectedTracks?: string[];
  getTrackVotes?: (track: SpotifyApi.TrackObjectFull) => number;
  trackEnd?: (track: SpotifyApi.TrackObjectFull) => JSX.Element;
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
  onTrackLongPress?: (
    track: SpotifyApi.TrackObjectFull,
  ) => (event: GestureResponderEvent) => void;
}
