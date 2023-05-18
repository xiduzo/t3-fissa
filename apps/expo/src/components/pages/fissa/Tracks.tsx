import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useGetFissa } from "@fissa/hooks";
import { sortFissaTracksOrder, useDevices, useTracks } from "@fissa/utils";

import { useAuth } from "../../../providers";
import {
  Badge,
  Button,
  Divider,
  Popover,
  ProgressBar,
  TrackEnd,
  TrackList,
  TrackListItem,
} from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { TrackActions } from "./TrackActions";
import { QuickVoteModal, useQuickVote } from "./quickVote";

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const { data, isInitialLoading } = useGetFissa(pin);
  const { user } = useAuth();

  const showBackAnimation = useRef(new Animated.Value(0)).current;

  const { handleTouchMove, handleTouchEnd, toggleTrackFocus, isVoting } = useQuickVote(pin);

  const [selectedTrack, setSelectedTrack] = useState<SpotifyApi.TrackObjectFull | null>(null);

  const { activeDevice } = useDevices();
  const localTracks = useTracks(
    sortFissaTracksOrder(data?.tracks, data?.currentlyPlayingId).map(({ trackId }) => trackId),
  );

  const isPlaying = !!data?.currentlyPlayingId;
  const isOwner = user?.email === data?.by.email;

  const showTracks = useMemo(() => {
    if (!isOwner) return isPlaying;
    return isPlaying && activeDevice;
  }, [isPlaying, isOwner, activeDevice]);

  const getTrackVotes = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
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

  const currentTrackIndex = useMemo(() => {
    if (!data?.currentlyPlayingId) return 0;
    if (!localTracks.length) return 0;

    return localTracks.findIndex(({ id }) => id === data.currentlyPlayingId);
  }, [data?.currentlyPlayingId, localTracks]);

  const shouldShowBackButton = useCallback((showShow = false) => {
    Animated.spring(showBackAnimation, {
      toValue: Number(showShow),
      useNativeDriver: false,
    }).start();
  }, []);

  const scrollToCurrentIndex = useCallback(
    (viewOffset = 48) => {
      listRef?.current?.scrollToIndex({
        index: currentTrackIndex,
        animated: true,
        viewOffset,
      });
      shouldShowBackButton(false);
    },
    [currentTrackIndex, shouldShowBackButton],
  );

  const lastScrolledTo = useRef<string>();
  const currentIndexPosition = useRef<number>();

  useEffect(() => {
    if (lastScrolledTo.current === data?.currentlyPlayingId) return;
    if (!data?.currentlyPlayingId) return;

    setTimeout(() => {
      scrollToCurrentIndex(20);
      setTimeout(scrollToCurrentIndex, 300);
    }, 1500); // give TrackList time to render
  }, [data?.currentlyPlayingId, scrollToCurrentIndex]);

  const queue = useMemo(() => {
    return showTracks ? localTracks : [];
  }, [showTracks, localTracks]);

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

  const marginBottom = showBackAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

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
          <View className="mx-6">
            <ListEmptyComponent isLoading={isInitialLoading} />
          </View>
        }
        ListFooterComponent={<ListFooterComponent />}
      />
      <Animated.View
        className="absolute bottom-32 w-full items-center"
        style={{
          opacity: showBackAnimation,
          marginBottom,
        }}
      >
        <Button title="Back to current song" onPress={() => scrollToCurrentIndex()} />
      </Animated.View>
      <Popover visible={!!selectedTrack} onRequestClose={() => setSelectedTrack(null)}>
        {selectedTrack && (
          <TrackListItem
            inverted
            track={selectedTrack}
            hasBorder
            subtitlePrefix={
              getTrackVotes(selectedTrack) !== undefined ? (
                <Badge amount={getTrackVotes(selectedTrack)} />
              ) : null
            }
          />
        )}
        <Divider />
        <TrackActions track={selectedTrack!} onPress={() => setSelectedTrack(null)} />
      </Popover>
      <QuickVoteModal onTouchEnd={handleTouchEnd} getTrackVotes={getTrackVotes} />
    </>
  );
};
