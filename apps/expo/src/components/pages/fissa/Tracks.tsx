import {
  differenceInMilliseconds,
  sortFissaTracksOrder,
} from "@fissa/utils";
import { type FlashListRef } from "@shopify/flash-list";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { type JSX, useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import {
  Animated,
  InteractionManager,
  TouchableHighlight,
  View,
} from "react-native";

import { useCreateVote, useIsOwner, useOnActiveApp, useSkipTrack, useSpotifyTracks, useSpotifyDevices } from "../../../hooks";
import { useAuth, useTheme } from "../../../providers";
import { api } from "../../../utils";
import { QuickVoteModal, useQuickVote } from "../../quickVote";
import {
  Action,
  Divider,
  Icon,
  IconButton,
  Popover,
  ProgressBar,
  TrackEnd,
  TrackList,
  TrackListItem,
  Typography,
} from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";

const SCROLL_DISTANCE = 150;

const REFETCH_NORMAL = 5_000;
const REFETCH_FAST = 1_000;
const SONG_END_THRESHOLD = 10_000; // start fast-polling 10s before track ends

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const theme = useTheme();
  const context = api.useUtils();

  const listRef = useRef<FlashListRef<SpotifyApi.TrackObjectFull>>(null);

  const [refetchInterval, setRefetchInterval] = useState(REFETCH_NORMAL);

  const { data, isLoading: isInitialLoading } = api.fissa.byId.useQuery(pin, {
    refetchInterval,
  });

  // Single query for all of the current user's votes in this fissa
  const { data: userVotes } = api.vote.byFissaFromUser.useQuery(pin);
  const userVoteMap = useMemo(() => {
    const map = new Map<string, number>();
    if (userVotes && Array.isArray(userVotes)) {
      for (const v of userVotes) {
        map.set(v.trackId as string, v.vote as number);
      }
    }
    return map;
  }, [userVotes]);

  const isOwner = useIsOwner(pin);

  const buttonOffsetAnimation = useRef(new Animated.Value(0)).current;
  const scrollState = useRef({
    lastScrolledTo: "",
    currentOffset: 0,
    isProgrammaticScroll: false,
  });
  const userHasScrolledManually = useRef(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | undefined>();

  const marginBottom = buttonOffsetAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const { handleTouchMove, handleTouchEnd, toggleTrackFocus, isVoting } = useQuickVote(pin);

  const [selectedTrack, setSelectedTrack] = useState<SpotifyApi.TrackObjectFull>();


  const trackIds = useMemo(
    () => sortFissaTracksOrder(data?.tracks, data?.currentlyPlayingId).map(({ trackId }) => trackId),
    [data?.tracks, data?.currentlyPlayingId],
  );
  const { data: localTracks = [] } = useSpotifyTracks(trackIds);

  const isPlaying = !!data?.currentlyPlayingId;

  const { activeDevice } = useSpotifyDevices(isOwner && !isPlaying);

  const showTracks = isOwner ? isPlaying && !!activeDevice : isPlaying;
  const queue = showTracks ? localTracks : [];

  // Derive the active index from trackIds (always in sync with the tRPC data)
  // rather than from localTracks which depends on the Spotify cache and may
  // lag behind when the currently-playing track changes.
  const currentTrackIndex = useMemo(() => {
    if (!data?.currentlyPlayingId) return 0;
    const idx = trackIds.indexOf(data.currentlyPlayingId);
    if (idx === -1) return 0;
    // localTracks may be shorter than trackIds when Spotify hasn't fetched
    // every track yet — clamp so we never scroll past the end.
    return Math.min(idx, Math.max(0, localTracks.length - 1));
  }, [data?.currentlyPlayingId, trackIds, localTracks.length]);

  const showBackButton = useCallback(
    (offSet = 0) => {
      const absoluteOffset = Math.abs(offSet);
      const shouldTriggerScroll = absoluteOffset > SCROLL_DISTANCE;

      Animated.spring(buttonOffsetAnimation, {
        toValue: Number(shouldTriggerScroll),
        useNativeDriver: false,
      }).start();

      if (!shouldTriggerScroll) return setScrollDirection(undefined);

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
    (track: SpotifyApi.TrackObjectFull): JSX.Element | undefined => {
      const localTrack = data?.tracks.find(({ trackId }) => trackId === track.id);

      if (!localTrack) return;
      if (data?.currentlyPlayingId === track.id && isOwner) return <SkipTrackButton />;
      if (localTrack.hasBeenPlayed) return <TrackEnd />;

      return <TrackEnd vote={userVoteMap.get(track.id)} />;
    },
    [data?.tracks, data?.currentlyPlayingId, isOwner, userVoteMap],
  );

  const trackExtra = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      if (track.id !== data?.currentlyPlayingId) return;

      return <ProgressBar className="mt-4" track={track} expectedEndTime={data.expectedEndTime} />;
    },
    [data?.currentlyPlayingId, data?.expectedEndTime],
  );

  // Track the previous currentlyPlayingId so we can detect track changes
  const prevTrackIdRef = useRef(data?.currentlyPlayingId);

  // When the active track changes, drop back to normal polling
  useEffect(() => {
    if (
      prevTrackIdRef.current &&
      data?.currentlyPlayingId &&
      prevTrackIdRef.current !== data.currentlyPlayingId
    ) {
      setRefetchInterval(REFETCH_NORMAL);
    }
    prevTrackIdRef.current = data?.currentlyPlayingId;
  }, [data?.currentlyPlayingId]);

  useEffect(() => {
    if (!data?.expectedEndTime) return;

    const msUntilEnd = differenceInMilliseconds(data.expectedEndTime, new Date());

    // Schedule fast-polling ~10s before the track ends
    const msUntilFastPoll = Math.max(0, msUntilEnd - SONG_END_THRESHOLD);

    const fastPollTimeout = setTimeout(() => {
      setRefetchInterval(REFETCH_FAST);
    }, msUntilFastPoll);

    // Also keep the existing invalidation for when the track actually ends
    const endTimeout = setTimeout(() => {
      void context.fissa.byId.invalidate();
    }, msUntilEnd);

    return () => {
      clearTimeout(fastPollTimeout);
      clearTimeout(endTimeout);
    };
  }, [data?.expectedEndTime, context]);

  const scrollToCurrentIndex = useCallback(() => {
      userHasScrolledManually.current = false;
      scrollState.current.isProgrammaticScroll = true;
      listRef?.current?.scrollToIndex({
        index: currentTrackIndex,
        animated: true,
      });
      showBackButton(0);

      // Safety net: if the programmatic scroll doesn't produce a momentum-end
      // event (e.g. the list was already at the right position), we still need
      // to clear the flag so manual scrolls aren't silently swallowed.
      setTimeout(() => {
        scrollState.current.isProgrammaticScroll = false;
      }, 600);
    },
    [currentTrackIndex, showBackButton],
  );

  useEffect(() => {
    if (scrollState.current.lastScrolledTo === data?.currentlyPlayingId) return;
    if (!data?.currentlyPlayingId) return;

    // Track changed — reset manual scroll flag so we always follow the new track
    userHasScrolledManually.current = false;
    // Reset scroll direction so the button hides after a track change
    setScrollDirection(undefined);

    const task = InteractionManager.runAfterInteractions(() => {
      scrollToCurrentIndex();
      scrollState.current.lastScrolledTo = data.currentlyPlayingId!;
    });

    return () => task.cancel();
  }, [data?.currentlyPlayingId, scrollToCurrentIndex]);

  // Re-scroll to active track on every refetch (same track, list may have reordered),
  // but only if the user hasn't manually scrolled away.
  useEffect(() => {
    if (!data?.currentlyPlayingId) return;
    // Let the track-change effect above handle new tracks
    if (scrollState.current.lastScrolledTo !== data.currentlyPlayingId) return;
    if (userHasScrolledManually.current) return;

    const task = InteractionManager.runAfterInteractions(() => {
      scrollToCurrentIndex();
    });

    return () => task.cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]); // intentionally fires on every refetch

  useOnActiveApp(useCallback(() => {
    // App came to foreground — trigger a fresh fetch.
    // The refetch-based scroll effect below will scroll to the active track
    // once new data arrives (if the user hasn't manually scrolled away).
    void context.fissa.byId.invalidate(pin);
  }, [context, pin]));

  return (
    <>
      <TrackList
        ref={listRef}
        onScrollBeginDrag={() => {
          // User started dragging — any programmatic scroll is effectively done
          scrollState.current.isProgrammaticScroll = false;
          userHasScrolledManually.current = true;
        }}
        onScroll={({ nativeEvent }) => {
          // Don't show/hide the button while a programmatic scroll is animating
          if (scrollState.current.isProgrammaticScroll) return;
          showBackButton(nativeEvent.contentOffset.y - scrollState.current.currentOffset);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMomentumScrollEnd={(e) => {
          if (!data?.currentlyPlayingId) return;

          const offset = e.nativeEvent.contentOffset.y;

          // After a programmatic scroll (button press / track change),
          // record the new baseline offset.
          if (scrollState.current.isProgrammaticScroll) {
            scrollState.current.isProgrammaticScroll = false;
            scrollState.current.currentOffset = offset;
            return;
          }
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
        extraData={`${data?.currentlyPlayingId}-${data?.expectedEndTime ? new Date(data.expectedEndTime).getTime() : ""}`}
        ListEmptyComponent={
          <View className="mx-6 h-[80vh]">
            <ListEmptyComponent isLoading={isInitialLoading} />
          </View>
        }
        ListFooterComponent={<ListFooterComponent tracksShown={showTracks} />}
      />
      <Animated.View
        className="absolute bottom-7 z-50 w-full items-center md:bottom-36"
        pointerEvents={scrollDirection ? "auto" : "none"}
        style={{ opacity: buttonOffsetAnimation, marginBottom }}
      >
        <TouchableHighlight
          accessibilityLabel="Back to current song"
          onPress={() => scrollToCurrentIndex()}
          accessibilityRole="button"
          underlayColor={theme["900"] + "10"}
        >
          <View
            className="flex flex-row items-center gap-4 rounded-md border-2 px-3 py-2 shadow-md"
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
        userVoteMap={userVoteMap}
      />

      <QuickVoteModal onTouchEnd={handleTouchEnd} getTrackVotes={getTrackVotes} userVoteMap={userVoteMap} />
    </>
  );
};

const SkipTrackButton = () => {
  const { pin } = useGlobalSearchParams();

  const { mutateAsync, isPending } = useSkipTrack(String(pin));

  return (
    <IconButton
      onPress={mutateAsync}
      disabled={isPending}
      title="play next song"
      icon="skip-forward"
    />
  );
};

const SelectedTrackPopover: FC<SelectedTrackPopoverProps> = ({ track, onRequestClose, userVoteMap }) => {
  return (
    <Popover visible={!!track} onRequestClose={onRequestClose}>
      {track && <TrackListItem inverted track={track} hasBorder />}
      <Divider />
      {track && <TrackActions track={track} onPress={onRequestClose} userVoteMap={userVoteMap} />}
    </Popover>
  );
};

interface SelectedTrackPopoverProps {
  track?: SpotifyApi.TrackObjectFull;
  onRequestClose: () => void;
  userVoteMap: Map<string, number>;
}

const TrackActions: FC<TrackActionsProps> = ({ track, onPress, userVoteMap }) => {
  const { pin } = useGlobalSearchParams();
  const { data: fissa } = api.fissa.byId.useQuery(String(pin), {
    enabled: !!pin,
  });

  const { push } = useRouter();

  const isOwner = useIsOwner(String(pin));

  const { user } = useAuth();

  const userVote = userVoteMap.get(track.id);

  const { mutateAsync: voteOnTrack, isPending: isVoting } = useCreateVote(String(pin));

  const { mutateAsync: deleteTrack, isPending: isDeleting } = api.track.deleteTrack.useMutation({
    // TODO: optimistic update
    onSettled: async () => {
      await notificationAsync(NotificationFeedbackType.Success);
    },
  });

  const { mutateAsync: skipTrack, isPending: isSkipping } = useSkipTrack(String(pin), {
    onMutate: () => {
      onPress();
    },
  });

  const isActiveTrack = fissa?.currentlyPlayingId === track.id;
  const hasBeenPlayed = fissa?.tracks.find(({ trackId }) => trackId === track?.id)?.hasBeenPlayed;
  const canRemoveTrack = (fissa?.tracks.find(({ trackId }) => trackId === track?.id)?.by?.email === user?.email) || isOwner

  const handleVote = useCallback(
    (vote: number) => async () => {
      onPress();
      await voteOnTrack(vote, track.id);
    },
    [track.id, voteOnTrack, onPress],
  );

  const handleDelete = useCallback(async () => {
    onPress();
    await deleteTrack({ pin: String(pin), trackId: track.id });
  }, [deleteTrack, onPress, pin, track.id]);

  const handleSkipTrack = useCallback(async () => {
    onPress();
    await skipTrack();
  }, [skipTrack, onPress]);

  return (
    <>
      {hasBeenPlayed && (
        <Action
          onPress={handleVote(1)}
          inverted
          icon="sync"
          title="Replay song"
          subtitle="What a banger this was!"
        />
      )}
      {!isActiveTrack && !hasBeenPlayed && (
        <Action
          onPress={handleVote(1)}
          inverted
          active={userVote === 1}
          disabled={isVoting || userVote === 1}
          icon="arrow-up"
          title="Up-vote song"
          subtitle="It might move up in the queue"
        />
      )}
      {!isActiveTrack && !hasBeenPlayed && (
        <Action
          onPress={handleVote(-1)}
          inverted
          active={userVote === -1}
          disabled={isVoting || userVote === -1}
          icon="arrow-down"
          title="Down-vote song"
          subtitle="It might move down in the queue"
        />
      )}
      {isActiveTrack && !hasBeenPlayed && (
        <Action
          title="Skip song"
          subtitle={isOwner ? "Use your powers wisely" : "Poke your host to skip"}
          inverted
          disabled={!isOwner || isSkipping}
          onPress={handleSkipTrack}
          icon="skip-forward"
        />
      )}
      <Action
        inverted
        title="Save to spotify"
        subtitle="Capture those vibes"
        icon="spotify"
        onPress={() => {
          onPress();
          push(`/fissa/${fissa?.pin}/${track?.id}`);
        }}
      />
      {canRemoveTrack && !isActiveTrack && !hasBeenPlayed && (
        <Action
          inverted
          onPress={handleDelete}
          icon="trash"
          disabled={isDeleting}
          title="Remove song"
          subtitle="Mistakes were made"
        />
      )}
    </>
  );
};

interface TrackActionsProps {
  track: SpotifyApi.TrackObjectFull;
  onPress: () => void;
  userVoteMap: Map<string, number>;
}
