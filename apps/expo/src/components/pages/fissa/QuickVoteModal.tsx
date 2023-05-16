import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, GestureResponderEvent, Modal, View } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSearchParams } from "expo-router";
import { useCreateVote, useGetVoteFromUser } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import { useAuth } from "../../../providers";
import { Action, TrackEnd, TrackListItem } from "../../shared";
import { Badge } from "../../shared/Badge";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const QuickVoteModal: FC<Props> = ({ track, vote, touchStartPosition, onTouchEnd, getTrackVotes }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const focussedAnimation = useRef(new Animated.Value(0)).current;
  const actionOpacityAnimation = useRef(new Animated.Value(0)).current;
  const { data } = useGetVoteFromUser(String(pin), track?.id!, user);

  const opacity = focussedAnimation.interpolate({
    inputRange: [-Math.abs(touchStartPosition), 0],
    outputRange: [0.1, 0.98],
  });

  const scale = actionOpacityAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  useEffect(() => {
    if (!track) return;
    Haptics.selectionAsync();
    const offset = touchStartPosition - windowCenter;
    Animated.timing(focussedAnimation, {
      toValue: offset,
      duration: 0,
      useNativeDriver: false,
    }).start(() => {
      Animated.parallel([
        Animated.spring(focussedAnimation, {
          toValue: 0,
          bounciness: 3,
          useNativeDriver: false,
        }),
        Animated.timing(actionOpacityAnimation, {
          duration: 200,
          delay: 100,
          toValue: 1,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => {
      Animated.timing(actionOpacityAnimation, {
        duration: 0,
        toValue: 0,
        useNativeDriver: false,
      }).start();
    };
  }, [track, touchStartPosition]);

  const upVoteGradient = useMemo(() => {
    const isUpVote = vote === 1 || (data?.vote === 1 && vote !== -1);

    return [theme[isUpVote ? "100" : "900"] + "20", theme["900"] + "10"];
  }, [vote, data?.vote]);

  const downVoteGradient = useMemo(() => {
    const isDownVote = vote === -1 || (data?.vote === -1 && vote !== 1);

    return [theme["900"] + "10", theme[isDownVote ? "100" : "900"] + "20"];
  }, [vote, data?.vote]);

  return (
    <Modal
      transparent
      visible={!!track}
      // Redundant exit touch event
      // This should be handled by the track `onTouchEnd`
      // But if the track doesn't fire the user still needs a way out
      onTouchEnd={onTouchEnd}
    >
      <Animated.View className="absolute inset-0" style={{ opacity }} />
      <View className="h-full justify-center" style={{ backgroundColor: theme["900"] }}>
        <LinearGradient className="flex-1 justify-center" colors={upVoteGradient}>
          <Animated.View
            style={{
              opacity: actionOpacityAnimation,
              transform: [{ scale }],
            }}
          >
            <Action layout="column" title="Up-vote song" icon="arrow-up" active={data?.vote === 1} />
          </Animated.View>
        </LinearGradient>
        <Animated.View className="px-6" style={{ top: focussedAnimation }}>
          {track && (
            <TrackListItem
              track={track}
              subtitlePrefix={<Badge amount={getTrackVotes(track)} />}
              end={<TrackEnd trackId={track.id} pin={String(pin)} />}
            />
          )}
        </Animated.View>
        <LinearGradient className="flex-1 justify-center" colors={downVoteGradient}>
          <Animated.View
            style={{
              opacity: actionOpacityAnimation,
              transform: [{ scale: scale }],
            }}
          >
            <Action
              layout="column"
              reversed
              active={data?.vote === -1}
              icon="arrow-down"
              title="Down-vote song"
            />
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export const useQuickVote = (pin: string) => {
  const [vote, setVote] = useState(0);
  const touchStartPosition = useRef(0);
  const [focussedTrack, setFocussedTrack] = useState<SpotifyApi.TrackObjectFull>();

  const { mutateAsync } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType[vote > 0 ? "Success" : "Warning"]);
    },
  });

  const toggleTrackFocus = useCallback(
    (track?: SpotifyApi.TrackObjectFull) => async (event: GestureResponderEvent) => {
      touchStartPosition.current = event.nativeEvent.pageY;

      setFocussedTrack(track);
    },
    [],
  );

  const handleTouchEnd = useCallback(
    async (event: GestureResponderEvent) => {
      if (vote !== 0 && focussedTrack) mutateAsync(vote, focussedTrack.id);

      await toggleTrackFocus()(event);
    },
    [toggleTrackFocus, focussedTrack, vote],
  );

  const newVote = useCallback(
    (next: number) => (prev: number) => {
      if (prev !== next) Haptics.selectionAsync();
      return next;
    },
    [],
  );

  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!focussedTrack) return;

      const TRIGGER_DIFF = 100;

      const { pageY } = event.nativeEvent;

      if (pageY < windowCenter - TRIGGER_DIFF) {
        return setVote(newVote(1));
      }

      if (pageY > windowCenter + TRIGGER_DIFF) {
        return setVote(newVote(-1));
      }

      setVote(0);
    },
    [focussedTrack],
  );

  useEffect(() => {
    return () => setVote(0);
  }, []);

  return {
    vote,
    focussedTrack,
    touchStartPosition: touchStartPosition.current ?? 0,
    handleTouchMove,
    handleTouchEnd,
    toggleTrackFocus,
  };
};

interface Props {
  track?: SpotifyApi.TrackObjectFull;
  vote: number;
  touchStartPosition: number;
  onTouchEnd?: (event: GestureResponderEvent) => void;
  getTrackVotes: (track: SpotifyApi.TrackObjectFull) => number | undefined;
}
