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
import { SkipTrackButton } from "./buttons";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { QuickVoteModal, useQuickVote } from "./quickVote";
import { SelectedTrackPopover } from "./SelectedTrackPopover";

const SCROLL_DISTANCE = 150;

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const context = api.useContext();
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const { data, isInitialLoading } = useGetFissa(pin);
  const isOwner = useIsOwner(pin);

  const buttonOffsetAnimation = useRef(new Animated.Value(0)).current;
  const lastScrolledTo = useRef<string>();
  const currentIndexOffset = useRef(0);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | undefined>();

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
    (offSet = 0) => {
      Animated.spring(buttonOffsetAnimation, {
        toValue: Number(Math.abs(offSet) > SCROLL_DISTANCE),
        useNativeDriver: false,
      }).start();
      if (offSet === 0) return;

      setScrollDirection(offSet > 0 ? "up" : "down");
    },
    [buttonOffsetAnimation, setScrollDirection],
  );

  const getTrackVotes = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      if (data?.currentlyPlayingId === track.id) return;

      const localTrack = data?.tracks.find(({ trackId }) => trackId === track.id);

      if (!localTrack) return;
      if (localTrack.hasBeenPlayed) return;

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
      context.fissa.byId.invalidate().catch(console.log);
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
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPos = nativeEvent.contentOffset.y;

      if (Math.abs(scrollPos - currentIndexOffset.current) >= SCROLL_DISTANCE) return;

      scrollToCurrentIndex();
    },
    [scrollToCurrentIndex],
  );

  useEffect(() => {
    if (lastScrolledTo.current === data?.currentlyPlayingId) return;
    if (!data?.currentlyPlayingId) return;
    if (scrollDirection) return;

    setTimeout(
      () => {
        setTimeout(scrollToCurrentIndex, AnimationSpeed.VeryFast);
      },
      currentIndexOffset.current ? 0 : 500, // give TrackList time to render
    );
  }, [data?.currentlyPlayingId, scrollToCurrentIndex, scrollDirection]);

  useOnActiveApp(scrollToCurrentIndex);

  return (
    <>
      <TrackList
        ref={listRef}
        onScroll={({ nativeEvent }) => {
          showBackButton(nativeEvent.contentOffset.y - currentIndexOffset.current);
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
        className="absolute bottom-7 z-50 w-full items-center md:bottom-36"
        style={{ opacity: buttonOffsetAnimation, marginBottom }}
      >
        <TouchableHighlight
          accessibilityLabel="Back to current song"
          onPress={() => scrollToCurrentIndex()}
          accessibilityRole="button"
          underlayColor={theme["900"] + "10"}
        >
          <View
            className="flex flex-row items-center space-x-4 rounded-md border-2 px-3 py-2 shadow-md"
            style={{
              backgroundColor: theme["900"],
              borderColor: theme["500"],
              shadowColor: theme["900"],
            }}
          >
            <Typography
              className="font-bold"
              centered
              variant="bodyM"
              style={{ color: theme["500"] }}
            >
              Current song
            </Typography>
            <Typography style={{ color: theme["500"] }}>
              <Icon name={scrollDirection === "down" ? "arrow-down" : "arrow-up"} />
            </Typography>
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
