import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import {
  Animated,
  TouchableHighlight,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { type FlashList } from "@shopify/flash-list";
import { useGetFissa, useIsOwner } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import {
  AnimationSpeed,
  differenceInMilliseconds,
  sortFissaTracksOrder,
  useDevices,
  useTracks,
} from "@fissa/utils";

import { useOnActiveApp } from "../../../hooks";
import { api } from "../../../utils";
import { Icon, ProgressBar, TrackEnd, TrackList, Typography } from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { SelectedTrackPopover } from "./SelectedTrackPopover";
import { SkipTrackButton } from "./buttons";
import { QuickVoteModal, useQuickVote } from "./quickVote";

const SCROLL_DISTANCE = 150;

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const context = api.useContext();
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const { data, isInitialLoading } = useGetFissa(pin);
  const isOwner = useIsOwner(pin);

  const buttonOffsetAnimation = useRef(new Animated.Value(0)).current;
  const lastScrolledTo = useRef<string>();
  const currentIndexOffset = useRef<number>();

  const marginBottom = buttonOffsetAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const { handleTouchMove, handleTouchEnd, toggleTrackFocus, isVoting } = useQuickVote(pin);

  const [selectedTrack, setSelectedTrack] = useState<SpotifyApi.TrackObjectFull>();

  const { activeDevice } = useDevices();

  const localTracks = useTracks(
    sortFissaTracksOrder(data?.tracks, data?.currentlyPlayingId).map(({ trackId }) => trackId),
  );

  const isPlaying = !!data?.currentlyPlayingId;

  const showTracks = useMemo(() => {
    if (!isOwner) return isPlaying;
    return isPlaying && !!activeDevice;
  }, [isPlaying, isOwner, activeDevice]);

  const queue = useMemo(() => (showTracks ? localTracks : []), [showTracks, localTracks]);

  const currentTrackIndex = useMemo(
    () => localTracks.findIndex(({ id }) => id === data?.currentlyPlayingId) ?? 0,
    [data?.currentlyPlayingId, localTracks],
  );

  const showBackButton = useCallback(
    (toValue = 0) => {
      Animated.spring(buttonOffsetAnimation, {
        toValue,
        useNativeDriver: false,
      }).start();
    },
    [buttonOffsetAnimation],
  );

  const getTrackVotes = useCallback(
    (track?: SpotifyApi.TrackObjectFull) => {
      if (!track) return;
      const localTrack = data?.tracks.find(({ trackId }) => trackId === track.id);

      if (!localTrack) return;
      if (localTrack.hasBeenPlayed) return;
      if (data?.currentlyPlayingId === track.id) return;

      return localTrack.score;
    },
    [data?.tracks, data?.currentlyPlayingId],
  );

  const trackEnd = useCallback(
    (track?: SpotifyApi.TrackObjectFull): JSX.Element | undefined => {
      if (!track) return;
      const localTrack = data?.tracks.find(({ trackId }) => trackId === track.id);

      if (!localTrack) return;
      if (localTrack.hasBeenPlayed) return;
      if (data?.currentlyPlayingId === track.id) {
        if (!isOwner) return;

        return <SkipTrackButton />;
      }

      return <TrackEnd trackId={track.id} pin={pin} />;
    },
    [data?.tracks, data?.currentlyPlayingId, isOwner, pin],
  );

  const trackExtra = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      if (track.id !== data?.currentlyPlayingId) return null;

      return <ProgressBar className="mt-4" track={track} expectedEndTime={data.expectedEndTime} />;
    },
    [data?.currentlyPlayingId, data?.expectedEndTime],
  );

  useEffect(() => {
    if (!data?.expectedEndTime) return;

    const ms = differenceInMilliseconds(data?.expectedEndTime, new Date());

    const timeout = setTimeout(() => {
      // Invalidate the fissa to force fetch the new state
      // When we know the track has ended
      context.fissa.byId.invalidate().catch(console.warn);
    }, ms);

    return () => clearTimeout(timeout);
  }, [data?.expectedEndTime, context]);

  const scrollToCurrentIndex = useCallback(
    (viewOffset = 20) => {
      listRef?.current?.scrollToIndex({
        index: currentTrackIndex,
        animated: true,
        viewOffset: currentTrackIndex === 0 ? 0 : viewOffset,
      });
      showBackButton(0);
    },
    [currentTrackIndex, showBackButton],
  );

  const lockOnActiveTrack = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!currentIndexOffset.current) return;

      const scrollPos = e.nativeEvent.contentOffset.y;

      if (Math.abs(scrollPos - currentIndexOffset.current) >= SCROLL_DISTANCE) return;

      scrollToCurrentIndex();
    },
    [scrollToCurrentIndex],
  );

  useEffect(() => {
    if (lastScrolledTo.current === data?.currentlyPlayingId) return;
    if (!data?.currentlyPlayingId) return;

    console.log("scrolling to current index");
    setTimeout(
      () => {
        setTimeout(scrollToCurrentIndex, AnimationSpeed.VeryFast);
      },
      currentIndexOffset.current ? 0 : 500, // give TrackList time to render
    );
  }, [data?.currentlyPlayingId, scrollToCurrentIndex]);

  useOnActiveApp(scrollToCurrentIndex);

  return (
    <>
      <TrackList
        ref={listRef}
        onScroll={(e) => {
          if (!currentIndexOffset.current) return;

          const scrollPos = e.nativeEvent.contentOffset.y;

          showBackButton(
            Number(Math.abs(scrollPos - currentIndexOffset.current) >= SCROLL_DISTANCE),
          );
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScrollEndDrag={lockOnActiveTrack}
        onMomentumScrollEnd={(e) => {
          if (!data?.currentlyPlayingId) return;
          if (lastScrolledTo.current === data?.currentlyPlayingId) return;

          lastScrolledTo.current = data?.currentlyPlayingId;
          currentIndexOffset.current = e.nativeEvent.contentOffset.y;
          lockOnActiveTrack(e);
        }}
        stickyHeaderIndices={[currentTrackIndex]}
        invertStickyHeaders
        scrollToOverflowEnabled
        scrollEnabled={!isVoting}
        data={queue}
        activeIndex={currentTrackIndex}
        getTrackVotes={getTrackVotes}
        onTrackPress={setSelectedTrack}
        onTrackLongPress={toggleTrackFocus}
        trackEnd={trackEnd}
        trackExtra={trackExtra}
        ListEmptyComponent={
          <View className="mx-6 h-[80vh]">
            <ListEmptyComponent isLoading={isInitialLoading} />
          </View>
        }
        ListFooterComponent={<ListFooterComponent tracksShown={showTracks} />}
      />
      <Animated.View
        className="absolute bottom-32 w-full items-center md:bottom-36"
        style={{ opacity: buttonOffsetAnimation, marginBottom }}
      >
        <TouchableHighlight
          accessibilityLabel="Back to current song"
          onPress={() => scrollToCurrentIndex()}
          accessibilityRole="button"
          underlayColor={theme["900"] + "10"}
        >
          <View
            className="rounded-md border-2 px-3 py-2 shadow-md"
            style={{
              backgroundColor: theme["900"],
              borderColor: theme["500"],
              shadowColor: theme["900"],
            }}
          >
            <View className="flex flex-row space-x-4">
              <Typography style={{ color: theme["500"] }}>
                <Icon name={"reload1"} />
              </Typography>
              <Typography
                className="font-bold"
                centered
                variant="h3"
                style={{ color: theme["500"] }}
              >
                Back to current song
              </Typography>
            </View>
          </View>
        </TouchableHighlight>
      </Animated.View>
      <SelectedTrackPopover
        onRequestClose={() => setSelectedTrack(undefined)}
        track={selectedTrack}
      />

      <QuickVoteModal onTouchEnd={handleTouchEnd} getTrackVotes={getTrackVotes} />
    </>
  );
};
