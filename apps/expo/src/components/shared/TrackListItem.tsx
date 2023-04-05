import { FC, memo, useCallback, useEffect, useRef } from "react";
import { Animated, LayoutChangeEvent } from "react-native";

import { ListItem, ListItemProps } from "./ListItem";

export const TrackListItem: FC<Props> = memo(
  ({ track, index, ...props }) => {
    const positionAnimation = useRef(new Animated.Value(0)).current;
    const previousIndex = useRef(index ?? 0);
    const height = useRef(0);

    const setHeight = useCallback((e: LayoutChangeEvent) => {
      height.current = e.nativeEvent.layout.height;
    }, []);

    useEffect(() => {
      const diff = previousIndex.current - (index ?? 0);
      previousIndex.current = index ?? 0;
      if (diff === 0) return;

      Animated.timing(positionAnimation, {
        toValue: diff * 100,
        duration: 0,
        useNativeDriver: false,
      }).start(() => {
        Animated.spring(positionAnimation, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      });
    }, [index, track]);

    return (
      <Animated.View onLayout={setHeight} style={{ top: positionAnimation }}>
        <ListItem
          {...props}
          title={track.name}
          subtitle={track.artists.map((artist) => artist.name).join(", ")}
          imageUri={track.album.images[0]?.url}
        />
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.track.id === next.track.id &&
    prev.selected === next.selected &&
    prev.index === next.index,
);

interface Props extends Omit<ListItemProps, "title" | "subtitle" | "imageUri"> {
  track: SpotifyApi.TrackObjectFull;
  index?: number;
}
