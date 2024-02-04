import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import {
  Animated,
  TouchableHighlight,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { type FlashList } from "@shopify/flash-list";
import { theme } from "@fissa/tailwind-config";
import {
  AnimationSpeed,
  differenceInMilliseconds,
  sortFissaTracksOrder,
  useDevices,
  useTracks,
} from "@fissa/utils";

import {
  useCreateVote,
  useGetVoteFromUser,
  useIsOwner,
  useOnActiveApp,
  useSkipTrack,
} from "../../../hooks";
import { useAuth } from "../../../providers";
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

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const context = api.useContext();
  const listRef = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const { data, isInitialLoading } = api.fissa.byId.useQuery(pin, {
    onSuccess: (fissa) => {
      // TODO: when joining a fissa that has ended, we should show a message
      // and redirect to the home page
      console.log(fissa);
      // toast.error({
      //   message: error.message,
      // });
    },
  });
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
      if (localTrack.hasBeenPlayed) return;
      if (data?.currentlyPlayingId === track.id && isOwner) return <SkipTrackButton />;

      return <TrackEnd trackId={track.id} pin={pin} />;
    },
    [data?.tracks, data?.currentlyPlayingId, isOwner, pin],
  );

  const trackExtra = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      if (track.id !== data?.currentlyPlayingId) return;

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
      void context.fissa.byId.invalidate();
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

const SkipTrackButton = () => {
  const { pin } = useGlobalSearchParams();

  const { mutateAsync, isLoading } = useSkipTrack(String(pin));

  return (
    <IconButton
      onPress={mutateAsync}
      disabled={isLoading}
      title="play next song"
      icon="skip-forward"
    />
  );
};

const SelectedTrackPopover: FC<SelectedTrackPopoverProps> = ({ track, onRequestClose }) => {
  return (
    <Popover visible={!!track} onRequestClose={onRequestClose}>
      {track && <TrackListItem inverted track={track} hasBorder />}
      <Divider />
      {track && <TrackActions track={track} onPress={onRequestClose} />}
    </Popover>
  );
};

interface SelectedTrackPopoverProps {
  track?: SpotifyApi.TrackObjectFull;
  onRequestClose: () => void;
}

const TrackActions: FC<TrackActionsProps> = ({ track, onPress }) => {
  const { pin } = useGlobalSearchParams();
  const { data: fissa } = api.fissa.byId.useQuery(String(pin));

  const { push } = useRouter();

  const isOwner = useIsOwner(String(pin));

  const { user } = useAuth();

  const { data } = useGetVoteFromUser(String(pin), track.id, user);

  const { mutateAsync: voteOnTrack, isLoading: isVoting } = useCreateVote(String(pin));

  const { mutateAsync: deleteTrack, isLoading: isDeleting } = api.track.deleteTrack.useMutation({
    onSettled: async () => {
      await notificationAsync(NotificationFeedbackType.Success);
    },
  });

  const { mutateAsync: skipTrack, isLoading: isSkipping } = useSkipTrack(String(pin), {
    onMutate: () => {
      onPress();
    },
  });

  const isActiveTrack = useMemo(() => fissa?.currentlyPlayingId === track.id, [fissa, track.id]);

  const hasBeenPlayed = useMemo(
    () => fissa?.tracks.find(({ trackId }) => trackId === track?.id)?.hasBeenPlayed,
    [track?.id, fissa?.tracks],
  );

  const canRemoveTrack = useMemo(() => {
    const isAddedByUser =
      fissa?.tracks.find(({ trackId }) => trackId === track?.id)?.by?.email === user?.id;

    if (isAddedByUser) return true;

    return isOwner;
  }, [track?.id, fissa?.tracks, user, isOwner]);

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
          active={data?.vote === 1}
          disabled={isVoting || data?.vote === 1}
          icon="arrow-up"
          title="Up-vote song"
          subtitle="It might move up in the queue"
        />
      )}
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
      {!isActiveTrack && !hasBeenPlayed && (
        <Action
          onPress={handleVote(-1)}
          inverted
          active={data?.vote === -1}
          disabled={isVoting || data?.vote === -1}
          icon="arrow-down"
          title="Down-vote song"
          subtitle="It might move down in the queue"
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
    </>
  );
};

interface TrackActionsProps {
  track: SpotifyApi.TrackObjectFull;
  onPress: () => void;
}
