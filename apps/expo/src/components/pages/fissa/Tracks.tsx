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

  const scrollToCurrentIndex = useCallback(
    (viewOffset: number, animated = true) => {
      listRef?.current?.scrollToIndex({
        index: currentTrackIndex,
        animated,
        viewOffset,
      });
    },
    [currentTrackIndex],
  );

  const lastScrolledTo = useRef<string>();
  const scrollPosition = useRef<number>();

  useEffect(() => {
    if (lastScrolledTo.current === data?.currentlyPlayingId) return;
    if (!data?.currentlyPlayingId) return;

    setTimeout(() => {
      scrollToCurrentIndex(64);
    }, 1000);
  }, [data?.currentlyPlayingId, scrollToCurrentIndex]);

  useEffect(() => {
    listRef.current?.shouldComponentUpdate;
  }, []);

  console.log({ currentTrackIndex });
  return (
    <>
      <TrackList
        ref={listRef}
        // onScroll={async (e) => {
        //   const scrollPos = e.nativeEvent.contentOffset.y;
        //   if (showPlayedTracks) return;
        //   if (!scrollPosition.current) return;
        //   if (isClosing.current) return;

        //   const triesToScrollUp = scrollPos < scrollPosition.current;
        //   if (!triesToScrollUp) return;
        //   scrollToCurrentIndex(64, false);
        // }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMomentumScrollEnd={(e) => {
          if (!data?.currentlyPlayingId) return;
          if (lastScrolledTo.current === data?.currentlyPlayingId) return;

          lastScrolledTo.current = data!.currentlyPlayingId!;
          scrollPosition.current = e.nativeEvent.contentOffset.y;
        }}
        stickyHeaderIndices={[currentTrackIndex]}
        invertStickyHeaders
        scrollToOverflowEnabled
        scrollEnabled={!isVoting}
        data={showTracks ? localTracks : []}
        extraData={data?.currentlyPlayingId}
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
        ListFooterComponent={
          Boolean(localTracks.length) && isPlaying && activeDevice && !isInitialLoading ? (
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
