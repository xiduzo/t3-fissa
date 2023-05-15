import { FC, forwardRef } from "react";
import { GestureResponderEvent, View } from "react-native";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Badge } from "./Badge";
import { TrackListItem } from "./TrackListItem";

export const TrackList = forwardRef<
  FlashList<SpotifyApi.TrackObjectFull>,
  Props
>(
  (
    {
      onTrackPress,
      onTrackLongPress,
      selectedTracks,
      activeTrackId,
      getTrackVotes,
      trackEnd,
      trackExtra,
      ...props
    },
    ref,
  ) => {
    return (
      <View className="h-full w-full">
        <FlashList
          {...props}
          ref={ref}
          estimatedItemSize={80}
          keyExtractor={({ id }) => id}
          extraData={selectedTracks}
          ItemSeparatorComponent={ItemSeparatorComponent}
          renderItem={({ item, index }) => (
            <TrackListItem
              className={trackListItem({ selected: activeTrackId === item.id })}
              style={{
                backgroundColor:
                  activeTrackId === item.id
                    ? theme["500"] + "08"
                    : "transparent",
              }}
              key={item.id}
              index={index}
              track={item}
              subtitlePrefix={
                getTrackVotes && <Badge amount={getTrackVotes(item)} />
              }
              end={trackEnd && trackEnd(item)}
              extra={trackExtra && trackExtra(item)}
              onPress={() => onTrackPress?.(item)}
              onLongPress={onTrackLongPress?.(item)}
              selected={selectedTracks?.includes(item.id)}
            />
          )}
        />
      </View>
    );
  },
);

export type TrackListProps = Props;

interface Props
  extends Omit<
    FlashListProps<SpotifyApi.TrackObjectFull>,
    "keyExtractor" | "renderItem"
  > {
  selectedTracks?: string[];
  activeTrackId?: string | null;
  getTrackVotes?: (track: SpotifyApi.TrackObjectFull) => number;
  trackExtra?: (track: SpotifyApi.TrackObjectFull) => JSX.Element | null;
  trackEnd?: (track: SpotifyApi.TrackObjectFull) => JSX.Element;
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
  onTrackLongPress?: (
    track: SpotifyApi.TrackObjectFull,
  ) => (event: GestureResponderEvent) => void;
}

const ItemSeparatorComponent = () => <View className="h-6" />;

const trackListItem = cva("rounded-2xl transition-all duration-200", {
  variants: {
    selected: {
      true: "mx-4 p-2",
      false: "mx-6",
    },
  },
  defaultVariants: {
    selected: false,
  },
});
