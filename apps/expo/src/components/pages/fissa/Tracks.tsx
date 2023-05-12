import { FC, useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, GestureResponderEvent, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useCreateVote, useGetFissa } from "@fissa/hooks";
import { logger, sortTracksByScore, useDevices, useTracks } from "@fissa/utils";

import {
  Divider,
  Popover,
  TrackEnd,
  TrackList,
  TrackListItem,
} from "../../shared";
import { Badge } from "../../shared/Badge";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { ListHeaderComponent } from "./ListHeaderComponent";
import { QuickVoteModal } from "./QuickVoteModal";
import { TrackActions } from "./TrackActions";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const { data, isInitialLoading } = useGetFissa(pin);
  const focussedPosition = useRef(0);
  const [vote, setVote] = useState(0);
  const [focussedTrack, setFocussedTrack] =
    useState<SpotifyApi.TrackObjectFull>();
  const [selectedTrack, setSelectedTrack] =
    useState<SpotifyApi.TrackObjectFull | null>(null);

  const { mutateAsync } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(
        vote > 0
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    },
  });

  const { activeDevice } = useDevices();
  const localTracks = useTracks(
    sortTracksByScore(data?.tracks).map(({ trackId }) => trackId),
  );

  const isPlaying = !!data?.currentlyPlayingId;

  const getTrackVotes = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      return (
        data?.tracks.find(({ trackId }) => trackId === track.id)?.score ?? 0
      );
    },
    [data?.tracks],
  );

  const tracks = useMemo(() => {
    return localTracks.filter((track) => track.id !== data?.currentlyPlayingId);
  }, [localTracks, data?.currentlyPlayingId]);

  const toggleLongPress = useCallback(
    (track?: SpotifyApi.TrackObjectFull) =>
      async (event: GestureResponderEvent) => {
        focussedPosition.current = event.nativeEvent.pageY;

        setFocussedTrack(track);
        setVote(0);
      },
    [],
  );

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      if (vote !== 0 && focussedTrack) {
        mutateAsync(vote, focussedTrack.id);
      }

      toggleLongPress()(event);
    },
    [toggleLongPress, focussedTrack, vote],
  );

  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!focussedTrack) return;

      const TRIGGER_DIFF = 100;

      const { pageY } = event.nativeEvent;

      if (pageY < windowCenter - TRIGGER_DIFF) {
        setVote((prev) => {
          if (prev !== 1) Haptics.selectionAsync();
          return 1;
        });

        return;
      }
      if (pageY > windowCenter + TRIGGER_DIFF) {
        setVote((prev) => {
          if (prev !== -1) Haptics.selectionAsync();
          return -1;
        });

        return;
      }

      setVote(0);
    },
    [focussedTrack],
  );

  return (
    <>
      <TrackList
        onScroll={(e) => logger.debug(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={200}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        scrollEnabled={!focussedTrack}
        data={isPlaying && activeDevice ? tracks : []}
        getTrackVotes={getTrackVotes}
        onTrackPress={setSelectedTrack}
        onTrackLongPress={toggleLongPress}
        trackEnd={({ id }) => <TrackEnd trackId={id} pin={pin} />}
        ListHeaderComponent={
          isPlaying && activeDevice ? (
            <ListHeaderComponent
              queue={tracks.length}
              activeTrack={localTracks.find(
                ({ id }) => id === data?.currentlyPlayingId,
              )}
            />
          ) : null
        }
        ListEmptyComponent={
          <View className="mx-6">
            <ListEmptyComponent isLoading={isInitialLoading} />
          </View>
        }
        ListFooterComponent={
          Boolean(tracks.length) &&
          isPlaying &&
          activeDevice &&
          !isInitialLoading ? (
            <ListFooterComponent />
          ) : null
        }
      />
      <Popover
        visible={!!selectedTrack}
        onRequestClose={() => setSelectedTrack(null)}
      >
        {selectedTrack && (
          <TrackListItem
            inverted
            track={selectedTrack}
            subtitlePrefix={
              <Badge inverted amount={getTrackVotes(selectedTrack)} />
            }
            hasBorder
          />
        )}
        <Divider />
        <TrackActions
          track={selectedTrack!}
          onPress={() => setSelectedTrack(null)}
          addedByEmail={
            data?.tracks.find(({ trackId }) => trackId === selectedTrack?.id)
              ?.by?.email
          }
        />
      </Popover>
      <QuickVoteModal
        focussedPosition={focussedPosition.current}
        getTrackVotes={getTrackVotes}
        vote={vote}
        track={focussedTrack}
        onTouchEnd={handleTouchEnd}
      />
    </>
  );
};
