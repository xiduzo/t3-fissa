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
      highlightedTrackId,
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

    return (
      <View className="h-full w-full" style={{}}>
        <FlashList
          {...props}
          ref={ref}
          estimatedItemSize={80}
          keyExtractor={({ id }) => id}
          extraData={selectedTracks}
          ItemSeparatorComponent={ItemSeparatorComponent}
          renderItem={({ item, index }) => (
            <View style={{ backgroundColor: theme["900"] }}>
              <TrackListItem
                className={trackListItem({
                  highlighted: highlightedTrackId === item.id,
                })}
                style={{
                  backgroundColor:
                    highlightedTrackId === item.id ? theme["500"] + "30" : "transparent",
                }}
                key={item.id}
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
  highlightedTrackId?: string | null;
  getTrackVotes?: (track: SpotifyApi.TrackObjectFull) => number | undefined;
  trackExtra?: (track: SpotifyApi.TrackObjectFull) => JSX.Element | null;
  trackEnd?: (track: SpotifyApi.TrackObjectFull) => JSX.Element;
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
  onTrackLongPress?: (track: SpotifyApi.TrackObjectFull) => (event: GestureResponderEvent) => void;
}

const ItemSeparatorComponent = () => <View className="h-6" />;

const trackListItem = cva("rounded-2xl transition-all duration-200", {
  variants: {
    highlighted: {
      true: "mx-4 p-2 mb-3",
      false: "mx-6",
    },
  },
  defaultVariants: {
    highlighted: false,
  },
});
