import { RefObject, useCallback, useEffect, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";

export const useTracksScroll = (
  activeScrollIndex: number,
  ref: RefObject<FlashList<SpotifyApi.TrackObjectFull>>,
) => {
  const currentTrackScrollOffset = useRef(0);
  const safeArea = useSafeAreaInsets();

  const setCurrentTrackScrollOffset = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    currentTrackScrollOffset.current = event.nativeEvent.contentOffset.y;
  }, []);

  const scrollToActiveIndex = useCallback(() => {
    ref?.current?.scrollToIndex({
      index: activeScrollIndex,
      animated: true,
      viewOffset: safeArea.top + 64,
    });
  }, [activeScrollIndex, safeArea, ref]);

  useEffect(() => {
    if (activeScrollIndex < 0) return;

    const timeout = setTimeout(scrollToActiveIndex, 1000);

    return () => clearTimeout(timeout);
  }, [activeScrollIndex, scrollToActiveIndex]);

  return {
    setCurrentTrackScrollOffset,
    currentTrackScrollOffset,
  };
};
