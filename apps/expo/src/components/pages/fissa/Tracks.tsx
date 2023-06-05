import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useGetFissa } from "@fissa/hooks";
import { sortFissaTracksOrder, useDevices, useTracks } from "@fissa/utils";

import { useAuth } from "../../../providers";
import { Button, ProgressBar, TrackEnd, TrackList } from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { SelectedTrackPopover } from "./SelectedTrackPopover";
import { QuickVoteModal, useQuickVote } from "./quickVote";

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const { data, isInitialLoading } = useGetFissa(pin);
  const { user } = useAuth();

  const showBackAnimation = useRef(new Animated.Value(0)).current;
  const lastScrolledTo = useRef<string>();
  const currentIndexPosition = useRef<number>();

  const marginBottom = showBackAnimation.interpolate({
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
  const isOwner = user?.email === data?.by.email;

  const showTracks = useMemo(() => {
    if (!isOwner) return isPlaying;
    return isPlaying && !!activeDevice;
  }, [isPlaying, isOwner, activeDevice]);

  const queue = useMemo(() => (showTracks ? localTracks : []), [showTracks, localTracks]);

  const currentTrackIndex = useMemo(
    () => localTracks.findIndex(({ id }) => id === data?.currentlyPlayingId) ?? 0,
    [data?.currentlyPlayingId, localTracks],
  );

  const shouldShowBackButton = useCallback((showShow = false) => {
    Animated.spring(showBackAnimation, {
      toValue: Number(showShow),
      useNativeDriver: false,
    }).start();
  }, []);

  const getTrackVotes = useCallback(
    (track?: SpotifyApi.TrackObjectFull) => {
      if (!track) return;
      const localTrack = data?.tracks.find(({ trackId }) => trackId === track.id);

      if (!localTrack) return;
      if (localTrack.hasBeenPlayed) return;
      if (data?.currentlyPlayingId === track.id) return;

      return localTrack.score;
    },
    [data?.tracks, data?.currentlyPlayingId, localTracks],
  );

  const trackEnd = useCallback(
    (track: SpotifyApi.TrackObjectFull): JSX.Element | undefined => {
      const localTrack = data?.tracks.find(({ trackId }) => trackId === track.id);

      if (!localTrack) return;
      if (localTrack.hasBeenPlayed) return;
      if (data?.currentlyPlayingId === track.id) return;

      return <TrackEnd trackId={track.id} pin={pin} />;
    },
    [data?.tracks, data?.currentlyPlayingId, localTracks],
  );

  const trackExtra = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      if (track.id !== data?.currentlyPlayingId) return null;

      return <ProgressBar className="mt-4" track={track} expectedEndTime={data.expectedEndTime} />;
    },
    [data?.currentlyPlayingId, data?.expectedEndTime],
  );

  const scrollToCurrentIndex = useCallback(
    (viewOffset = 48) => {
      listRef?.current?.scrollToIndex({
        index: currentTrackIndex,
        animated: true,
        viewOffset: currentTrackIndex === 0 ? 0 : viewOffset,
      });
      shouldShowBackButton(false);
    },
    [currentTrackIndex, shouldShowBackButton],
  );

  const lockOnActiveTrack = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!currentIndexPosition.current) return;

      const scrollPos = e.nativeEvent.contentOffset.y;
      const differenceFromCurrentIndex = scrollPos - currentIndexPosition.current;

      if (differenceFromCurrentIndex < -250) return; // scrolling up
      if (differenceFromCurrentIndex > 80) return; // scrolling down

      scrollToCurrentIndex();
    },
    [scrollToCurrentIndex],
  );

  useEffect(() => {
    if (lastScrolledTo.current === data?.currentlyPlayingId) return;
    if (!data?.currentlyPlayingId) return;

    setTimeout(() => {
      scrollToCurrentIndex(20);
      setTimeout(scrollToCurrentIndex, 300);
    }, 1500); // give TrackList time to render
  }, [data?.currentlyPlayingId, scrollToCurrentIndex]);

  return (
    <>
      <TrackList
        ref={listRef}
        onScroll={(e) => {
          if (!currentIndexPosition.current) return;
          if (lastScrolledTo.current !== data?.currentlyPlayingId) return;

          const scrollPos = e.nativeEvent.contentOffset.y;
          const differenceFromCurrentIndex = scrollPos - currentIndexPosition.current;

          shouldShowBackButton(
            differenceFromCurrentIndex < -250 || differenceFromCurrentIndex > 80,
          );
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScrollEndDrag={lockOnActiveTrack}
        onMomentumScrollEnd={(e) => {
          if (!data?.currentlyPlayingId) return;
          if (lastScrolledTo.current === data?.currentlyPlayingId) return;

          lastScrolledTo.current = data?.currentlyPlayingId;
          currentIndexPosition.current = e.nativeEvent.contentOffset.y;
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
        className="absolute items-center w-full bottom-32 md:bottom-36"
        style={{ opacity: showBackAnimation, marginBottom }}
      >
        <Button title="Back to current song" onPress={() => scrollToCurrentIndex()} />
      </Animated.View>
      <SelectedTrackPopover
        currentTrackIndex={currentTrackIndex}
        onRequestClose={() => setSelectedTrack(undefined)}
        track={selectedTrack}
      />

      <QuickVoteModal onTouchEnd={handleTouchEnd} getTrackVotes={getTrackVotes} />
    </>
  );
};
