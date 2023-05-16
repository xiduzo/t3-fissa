import { FC, useCallback, useMemo, useRef, useState } from "react";
import { View } from "react-native";
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

  return (
    <>
      <TrackList
        ref={listRef}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        stickyHeaderIndices={[0]}
        highlightedTrackId={data?.currentlyPlayingId}
        scrollToOverflowEnabled
        scrollEnabled={!isVoting}
        nestedScrollEnabled
        data={showTracks ? queue : []}
        getTrackVotes={getTrackVotes}
        onTrackPress={setSelectedTrack}
        onTrackLongPress={toggleTrackFocus}
        trackEnd={trackEnd}
        trackExtra={trackExtra}
        ListHeaderComponent={
          <View className="mb-4">
            <Button dimmed variant="text" title="Show played songs" icon="chevron-up" />
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
