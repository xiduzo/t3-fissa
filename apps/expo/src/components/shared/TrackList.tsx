import { forwardRef, useCallback } from "react";
import { Animated, View, type GestureResponderEvent } from "react-native";
import { FlashList, type FlashListProps } from "@shopify/flash-list";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Badge } from "./Badge";
import { TrackListItem } from "./TrackListItem";

export const TrackList = forwardRef<FlashList<SpotifyApi.TrackObjectFull>, Props>(
  function TrackList(
    {
      onTrackPress,
      onTrackLongPress,
      selectedTracks,
      activeIndex,
      getTrackVotes,
      trackEnd,
      trackExtra,
      extraData,
      ...props
    },
    ref,
  ) {
    const subtitlePrefix = useCallback(
      (item: SpotifyApi.TrackObjectFull) => {
        if (!getTrackVotes) return null;

        const votes = getTrackVotes(item);

        if (votes === undefined) return null;

        return <Badge amount={votes} />;
      },
      [getTrackVotes],
    );

    return (
      <View className="h-full w-full">
        <FlashList
          {...props}
          ref={ref}
          estimatedItemSize={80}
          keyExtractor={({ id }) => id}
          extraData={extraData ?? selectedTracks}
          renderItem={({ item, index }) => {
            const isHeader = props.stickyHeaderIndices?.includes(index);

            return (
              <Animated.View
                className="shadow-xl"
                style={{
                  backgroundColor: theme["900"],
                  shadowColor: isHeader ? theme["900"] : "transparent",
                }}
              >
                <TrackListItem
                  rerenderTrigger={props.stickyHeaderIndices}
                  dimmed={activeIndex ? index < activeIndex : false}
                  className={trackListItem({
                    highlighted: isHeader,
                  })}
                  style={{
                    backgroundColor: isHeader ? theme["500"] + "20" : "transparent",
                  }}
                  index={index}
                  track={item}
                  subtitlePrefix={subtitlePrefix(item)}
                  end={trackEnd?.(item)}
                  extra={trackExtra?.(item)}
                  onPress={() => onTrackPress?.(item)}
                  onLongPress={onTrackLongPress?.(item)}
                  selected={selectedTracks?.includes(item.id)}
                />
              </Animated.View>
            );
          }}
        />
      </View>
    );
  },
);

export type TrackListProps = Props;

interface Props
  extends Omit<FlashListProps<SpotifyApi.TrackObjectFull>, "keyExtractor" | "renderItem"> {
  selectedTracks?: string[];
  activeIndex?: number;
  getTrackVotes?: (track: SpotifyApi.TrackObjectFull) => number | undefined;
  trackExtra?: (track: SpotifyApi.TrackObjectFull) => JSX.Element | null;
  trackEnd?: (track: SpotifyApi.TrackObjectFull) => JSX.Element | undefined;
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
  onTrackLongPress?: (track: SpotifyApi.TrackObjectFull) => (event: GestureResponderEvent) => void;
}

const trackListItem = cva("rounded-2xl transition-all duration-1000 my-3", {
  variants: {
    highlighted: {
      true: "mx-4 p-2 pr-4",
      false: "mx-6",
    },
  },
  defaultVariants: {
    highlighted: false,
  },
});
