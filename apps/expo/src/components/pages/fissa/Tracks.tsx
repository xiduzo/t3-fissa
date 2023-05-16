import { FC, useCallback, useMemo, useRef, useState } from "react";
import { GestureResponderEvent, View } from "react-native";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { useCreateVote, useGetFissa } from "@fissa/hooks";
import { sortFissaTracksOrder, useDevices, useTracks } from "@fissa/utils";

import { useAuth } from "../../../providers";
import { Divider, Fab, Popover, ProgressBar, TrackEnd, TrackList, TrackListItem } from "../../shared";
import { Badge } from "../../shared/Badge";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { ListHeaderComponent } from "./ListHeaderComponent";
import { QuickVoteModal, useQuickVote } from "./QuickVoteModal";
import { TrackActions } from "./TrackActions";
import { useTracksScroll } from "./useTracksScroll";

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const { data, isInitialLoading } = useGetFissa(pin);
  const focussedPosition = useRef(0);
  const { user } = useAuth();

  const [focussedTrack, setFocussedTrack] = useState<SpotifyApi.TrackObjectFull>();
  const { vote, handleTouchMove } = useQuickVote(focussedTrack);

  const [selectedTrack, setSelectedTrack] = useState<SpotifyApi.TrackObjectFull | null>(null);

  const { mutateAsync } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType[vote > 0 ? "Success" : "Warning"]);
    },
  });

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

  const activeScrollIndex = useMemo(() => {
    return localTracks.findIndex(({ id }) => id === data?.currentlyPlayingId);
  }, [data?.currentlyPlayingId, localTracks]);

  const { setCurrentTrackScrollOffset, currentTrackScrollOffset } = useTracksScroll(
    activeScrollIndex,
    listRef,
  );

  const toggleLongPress = useCallback(
    (track?: SpotifyApi.TrackObjectFull) => async (event: GestureResponderEvent) => {
      focussedPosition.current = event.nativeEvent.pageY;

      setFocussedTrack(track);
    },
    [],
  );

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

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      if (vote !== 0 && focussedTrack) mutateAsync(vote, focussedTrack.id);

      toggleLongPress()(event);
    },
    [toggleLongPress, focussedTrack, vote],
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

  return (
    <>
      <TrackList
        onScrollEndDrag={(event) => {
          const scrollDiff = currentTrackScrollOffset.current - event.nativeEvent.contentOffset.y;

          console.log({ scrollDiff });
        }}
        onMomentumScrollEnd={setCurrentTrackScrollOffset}
        ref={listRef}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        highlightedTrackId={data?.currentlyPlayingId}
        scrollToOverflowEnabled
        scrollEnabled={!focussedTrack}
        data={showTracks ? localTracks : []}
        getTrackVotes={getTrackVotes}
        onTrackPress={setSelectedTrack}
        onTrackLongPress={toggleLongPress}
        trackEnd={trackEnd}
        trackExtra={trackExtra}
        ListHeaderComponent={<View className="h-28" />}
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
      <Fab title="add songs" position="bottom-left" icon="long-arrow-up" />
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
      <QuickVoteModal
        focussedPosition={focussedPosition.current}
        vote={vote}
        track={focussedTrack}
        onTouchEnd={handleTouchEnd}
        getTrackVotes={getTrackVotes}
      />
    </>
  );
};
