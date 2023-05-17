import { FC, forwardRef, useCallback } from "react";
import { GestureResponderEvent, View } from "react-native";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Badge } from "./Badge";
import { TrackListItem } from "./TrackListItem";

export const TrackList = forwardRef<FlashList<SpotifyApi.TrackObjectFull>, Props>(
  (
    {
      onTrackPress,
      onTrackLongPress,
      selectedTracks,
      getTrackVotes,
      trackEnd,
      trackExtra,
      ...props
    },
    ref,
  ) => {
    const subtitlePrefix = useCallback(
      (item: SpotifyApi.TrackObjectFull) => {
        if (!getTrackVotes) return null;

        const votes = getTrackVotes(item);

        if (votes === undefined) return null;

        return <Badge amount={votes} />;
      },
      [getTrackVotes],
    );

    console.log(props.extraData ?? selectedTracks, props.stickyHeaderIndices);
    return (
      <View className={`h-full w-full ${props.className}`}>
        <FlashList
          {...props}
          ref={ref}
          estimatedItemSize={80}
          keyExtractor={({ id }) => id}
          extraData={props.extraData ?? selectedTracks}
          renderItem={({ item, index }) => (
            <View
              className="shadow-xl"
              style={{
                backgroundColor: theme["900"],
                shadowColor: props.stickyHeaderIndices?.includes(index)
                  ? theme["900"]
                  : "transparent",
              }}
            >
              <TrackListItem
                className={trackListItem({
                  highlighted: props.stickyHeaderIndices?.includes(index),
                })}
                style={{
                  backgroundColor: props.stickyHeaderIndices?.includes(index)
                    ? theme["500"] + "30"
                    : "transparent",
                }}
                index={index}
                track={item}
                subtitlePrefix={subtitlePrefix(item)}
                end={trackEnd && trackEnd(item)}
                extra={trackExtra && trackExtra(item)}
                onPress={() => onTrackPress?.(item)}
                onLongPress={onTrackLongPress?.(item)}
                selected={selectedTracks?.includes(item.id)}
              />
            </View>
          )}
        />
      </View>
    );
  },
);

export type TrackListProps = Props;

interface Props
  extends Omit<FlashListProps<SpotifyApi.TrackObjectFull>, "keyExtractor" | "renderItem"> {
  selectedTracks?: string[];
  getTrackVotes?: (track: SpotifyApi.TrackObjectFull) => number | undefined;
  trackExtra?: (track: SpotifyApi.TrackObjectFull) => JSX.Element | null;
  trackEnd?: (track: SpotifyApi.TrackObjectFull) => JSX.Element | undefined;
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
  onTrackLongPress?: (track: SpotifyApi.TrackObjectFull) => (event: GestureResponderEvent) => void;
}

const trackListItem = cva("rounded-2xl transition-all duration-200 my-3", {
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
