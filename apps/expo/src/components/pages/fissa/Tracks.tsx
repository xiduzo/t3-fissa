import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, GestureResponderEvent, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { useCreateVote, useGetFissa } from "@fissa/hooks";
import { sortFissaTracksOrder, useDevices, useTracks } from "@fissa/utils";

import { useAuth } from "../../../providers";
import {
  Divider,
  Popover,
  ProgressBar,
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
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);
  const safeArea = useSafeAreaInsets();

  const { data, isInitialLoading } = useGetFissa(pin);
  const focussedPosition = useRef(0);
  const [vote, setVote] = useState(0);
  const { user } = useAuth();

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
    sortFissaTracksOrder(data?.tracks).map(({ trackId }) => trackId),
  );

  const isPlaying = !!data?.currentlyPlayingId;
  const isOwner = user?.email === data?.by.email;

  const getTrackVotes = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      return (
        data?.tracks.find(({ trackId }) => trackId === track.id)?.score ?? 0
      );
    },
    [data?.tracks],
  );

  const showTracks = useMemo(() => {
    if (!isOwner) return isPlaying;
    return isPlaying && activeDevice;
  }, [isPlaying, isOwner, activeDevice, isInitialLoading]);

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

  const trackEnd = useCallback((track: SpotifyApi.TrackObjectFull) => {
    return <TrackEnd trackId={track.id} pin={pin} />;
  }, []);

  const trackExtra = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      if (track.id !== data?.currentlyPlayingId) return null;

      return (
        <ProgressBar
          className="mt-4"
          track={track}
          expectedEndTime={data.expectedEndTime}
          disabled={!data.currentlyPlayingId}
        />
      );
    },
    [data],
  );

  useEffect(() => {
    listRef?.current?.scrollToIndex({
      index: localTracks.findIndex(({ id }) => id === data?.currentlyPlayingId),
      animated: true,
      viewOffset: safeArea.top + 64,
    });
  }, [data?.currentlyPlayingId, localTracks, safeArea]);

  return (
    <>
      <TrackList
        ref={listRef}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        activeTrackId={data?.currentlyPlayingId}
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
          Boolean(localTracks.length) &&
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
