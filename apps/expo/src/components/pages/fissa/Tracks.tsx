import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";
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
  Typography,
} from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { TrackActions } from "./TrackActions";
import { QuickVoteModal, useQuickVote } from "./quickVote";

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const { data, isInitialLoading } = useGetFissa(pin);
  const { user } = useAuth();
  const [showPlayedTracks, setShowPlayedTracks] = useState(false);

  const { handleTouchMove, handleTouchEnd, toggleTrackFocus, isVoting } = useQuickVote(pin);

  const [selectedTrack, setSelectedTrack] = useState<SpotifyApi.TrackObjectFull | null>(null);

  const { activeDevice } = useDevices();
  const queue = useTracks(
    sortFissaTracksOrder(
      data?.tracks.filter(({ hasBeenPlayed }) => !hasBeenPlayed),
      data?.currentlyPlayingId,
    ).map(({ trackId }) => trackId),
  );
  const playedTracks = useTracks(
    sortFissaTracksOrder(
      data?.tracks.filter(({ hasBeenPlayed }) => hasBeenPlayed),
      data?.currentlyPlayingId,
    ).map(({ trackId }) => trackId),
  );

  const isPlaying = !!data?.currentlyPlayingId;
  const isOwner = user?.email === data?.by.email;

  const showTracks = useMemo(() => {
    if (!isOwner) return isPlaying;
    return isPlaying && activeDevice;
  }, [isPlaying, isOwner, activeDevice]);

  const toggleShowPlayedTracks = useCallback(() => {
    setShowPlayedTracks(!showPlayedTracks);
    if (showPlayedTracks) return;
    listRef.current?.scrollToIndex({ index: 0, viewOffset: 64, animated: true });
  }, [showPlayedTracks]);

  const getTrackVotes = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      const localTrack = data?.tracks.find(({ trackId }) => trackId === track.id);

      if (!localTrack) return;
      if (localTrack.hasBeenPlayed) return;
      if (data?.currentlyPlayingId === track.id) return;

      return localTrack.score;
    },
    [data?.tracks, data?.currentlyPlayingId],
  );

  const trackEnd = useCallback((track: SpotifyApi.TrackObjectFull) => {
    return <TrackEnd trackId={track.id} pin={pin} />;
  }, []);

  const trackExtra = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      if (track.id !== data?.currentlyPlayingId) return null;

      return <ProgressBar className="mt-4" track={track} expectedEndTime={data.expectedEndTime} />;
    },
    [data?.currentlyPlayingId, data?.expectedEndTime],
  );

  const scrollToCurrentIndex = useCallback((viewOffset: number, animated = true) => {
    listRef?.current?.scrollToIndex({
      index: 0,
      animated,
      viewOffset,
    });
  }, []);

  useEffect(() => {
    scrollToCurrentIndex(showPlayedTracks ? 200 : 64);

    if (showPlayedTracks) {
      setTimeout(() => {
        scrollToCurrentIndex(showPlayedTracks ? 140 : 64);
      }, 300);
    }
  }, [showPlayedTracks, scrollToCurrentIndex]);

  const lastScrolledTo = useRef<string>();
  const scrollPosition = useRef<number>();

  useEffect(() => {
    if (showPlayedTracks) return;
    if (lastScrolledTo.current === data?.currentlyPlayingId) return;
    if (!data?.currentlyPlayingId) return;

    setTimeout(() => {
      scrollToCurrentIndex(64);
    }, 2000);
  }, [data?.currentlyPlayingId, showPlayedTracks, scrollToCurrentIndex]);

  return (
    <>
      <TrackList
        ref={listRef}
        onScroll={(e) => {
          const scrollPos = e.nativeEvent.contentOffset.y;
          if (!showPlayedTracks && scrollPosition.current) {
            const triesToScrollUp = scrollPos < scrollPosition.current;
            if (triesToScrollUp) {
              scrollToCurrentIndex(64, false);
            }
          }
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMomentumScrollEnd={(e) => {
          if (!data?.currentlyPlayingId) return;
          if (lastScrolledTo.current === data?.currentlyPlayingId) return;

          lastScrolledTo.current = data!.currentlyPlayingId!;
          scrollPosition.current = e.nativeEvent.contentOffset.y;
        }}
        stickyHeaderIndices={[0]}
        invertStickyHeaders
        highlightedTrackId={data?.currentlyPlayingId}
        scrollToOverflowEnabled
        scrollEnabled={!isVoting}
        data={showTracks ? queue : []}
        getTrackVotes={getTrackVotes}
        onTrackPress={setSelectedTrack}
        onTrackLongPress={toggleTrackFocus}
        trackEnd={trackEnd}
        trackExtra={trackExtra}
        ListHeaderComponent={
          <View className="my-2">
            <View className="h-auto min-h-[3px] w-full px-6 opacity-60">
              <FlashList
                data={playedTracks}
                ItemSeparatorComponent={() => <View className="h-6" />}
                className="opacity-30"
                estimatedItemSize={80}
                renderItem={({ item }) => <TrackListItem key={item.id} track={item} />}
              />
            </View>
            <Button
              dimmed={!showPlayedTracks}
              variant="text"
              title={`${showPlayedTracks ? "Hide" : "Show"} played tracks`}
              icon={showPlayedTracks ? "chevron-down" : "chevron-up"}
              onPress={toggleShowPlayedTracks}
            />
          </View>
        }
        ListEmptyComponent={
          <View className="mx-6">
            <ListEmptyComponent isLoading={isInitialLoading} />
          </View>
        }
        ListFooterComponent={
          Boolean(queue.length) && isPlaying && activeDevice && !isInitialLoading ? (
            <ListFooterComponent />
          ) : null
        }
      />
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
