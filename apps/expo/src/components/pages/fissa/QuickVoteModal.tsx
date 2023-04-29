import { FC, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  Modal,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { useGetVoteFromUser } from "../../../hooks";
import { useAuth } from "../../../providers";
import { Action, TrackEnd, TrackListItem } from "../../shared";
import { Badge } from "../../shared/Badge";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const QuickVoteModal: FC<Props> = ({
  track,
  vote,
  focussedPosition,
  onTouchEnd,
  getTrackVotes,
}) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const focussedAnimation = useRef(new Animated.Value(0)).current;
  const actionOpacityAnimation = useRef(new Animated.Value(0)).current;
  const { data } = useGetVoteFromUser(String(pin), track?.id!, user);

  const opacity = focussedAnimation.interpolate({
    inputRange: [-Math.abs(focussedPosition), 0],
    outputRange: [0.1, 0.98],
  });

  const scale = actionOpacityAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  useEffect(() => {
    if (!track) return;
    Haptics.selectionAsync();
    const offset = focussedPosition - windowCenter;
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
  }, [track, focussedPosition]);

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
      style={{ backgroundColor: theme["900"] }}
      visible={!!track}
      // Redundant exit touch event
      // This should be handled by the track `onTouchEnd`
      // But if the track doesn't fire the user still needs a way out
      onTouchEnd={onTouchEnd}
    >
      <Animated.View
        className="absolute inset-0"
        style={{ opacity, backgroundColor: theme["900"] }}
      />
      <View className="h-full justify-center">
        <LinearGradient
          className="flex-1 justify-center"
          colors={upVoteGradient}
        >
          <Animated.View
            style={{
              opacity: actionOpacityAnimation,
              transform: [{ scale }],
            }}
          >
            <Action
              layout="column"
              title="Up-vote song"
              icon="arrow-up"
              active={data?.vote === 1}
            />
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
        <LinearGradient
          className="flex-1 justify-center"
          colors={downVoteGradient}
        >
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

interface Props {
  track?: SpotifyApi.TrackObjectFull;
  vote: number;
  focussedPosition: number;
  onTouchEnd?: (event: GestureResponderEvent) => void;
  getTrackVotes: (track: SpotifyApi.TrackObjectFull) => number;
}
