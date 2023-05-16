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

  const scrollToCurrentTrack = useCallback(() => {
    ref?.current?.scrollToIndex({
      index: activeScrollIndex,
      animated: true,
      viewOffset: safeArea.top + 64,
    });
  }, [activeScrollIndex, safeArea, ref]);

  useEffect(() => {
    if (activeScrollIndex < 0) return;

    const timeout = setTimeout(scrollToCurrentTrack, 1000);

    return () => clearTimeout(timeout);
  }, [activeScrollIndex, scrollToCurrentTrack]);

  return {
    setCurrentTrackScrollOffset,
    scrollToCurrentTrack,
    currentTrackScrollOffset,
  };
};
