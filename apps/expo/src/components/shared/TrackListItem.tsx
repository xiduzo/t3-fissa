import { FC, memo, useCallback, useEffect, useRef } from "react";
import { Animated, Dimensions, LayoutChangeEvent } from "react-native";
import * as Haptics from "expo-haptics";

import { ListItem, ListItemProps } from "./ListItem";

const windowHeight = Dimensions.get("window").height;

export const TrackListItem: FC<Props> = memo(
  ({ track, index, ...props }) => {
    const positionAnimation = useRef(new Animated.Value(0)).current;
    const previousIndex = useRef(index ?? 0);
    const height = useRef(0);

    const setHeight = useCallback((e: LayoutChangeEvent) => {
      height.current = e.nativeEvent.layout.height;
    }, []);

    useEffect(() => {
      if (!props.selected) return;
      Haptics.selectionAsync();
    }, [props.selected]);

    useEffect(() => {
      const diff = previousIndex.current - (index ?? 0);
      previousIndex.current = index ?? 0;

      if (diff === 0) return;

      const toValue = diff * height.current;
      if (Math.abs(toValue) > windowHeight) return;

      Animated.timing(positionAnimation, {
        toValue,
        duration: 0,
        useNativeDriver: false,
      }).start(() => {
        Animated.spring(positionAnimation, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      });
    }, [index]);

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
  (prev, next) => {
    if (prev.index !== next.index) return false;
    if (prev.selected !== next.selected) return false;

    return true;
  },
);

interface Props extends Omit<ListItemProps, "title" | "subtitle" | "imageUri"> {
  track: SpotifyApi.TrackObjectFull;
  index?: number;
  isActive?: boolean;
}
