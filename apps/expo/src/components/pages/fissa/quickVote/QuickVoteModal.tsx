import { useContext, useEffect, useMemo, useRef, type FC } from "react";
import { Animated, Dimensions, Modal, View, type GestureResponderEvent } from "react-native";
import { selectionAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobalSearchParams } from "expo-router";
import { useGetVoteFromUser } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed } from "@fissa/utils";

import { useAuth } from "../../../../providers";
import { Action, Badge, TrackEnd, TrackListItem } from "../../../shared";
import { QuickVoteContext } from "./QuickVoteContext";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const QuickVoteModal: FC<Props> = ({ onTouchEnd, getTrackVotes }) => {
  const { pin } = useGlobalSearchParams();
  const { user } = useAuth();
  const { vote, touchStartPosition, track } = useContext(QuickVoteContext);

  const focussedAnimation = useRef(new Animated.Value(0)).current;
  const actionOpacityAnimation = useRef(new Animated.Value(0)).current;
  const { data } = useGetVoteFromUser(String(pin), track?.id ?? "", user);

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

    selectionAsync().catch(console.log);
    const offset = touchStartPosition - windowCenter;

    Animated.timing(focussedAnimation, {
      toValue: offset,
      duration: AnimationSpeed.Instant,
      useNativeDriver: false,
    }).start(() => {
      Animated.parallel([
        Animated.spring(focussedAnimation, {
          toValue: 0,
          bounciness: 3,
          useNativeDriver: false,
        }),
        Animated.timing(actionOpacityAnimation, {
          duration: AnimationSpeed.Fast,
          delay: 100,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      Animated.timing(actionOpacityAnimation, {
        duration: AnimationSpeed.Instant,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    };
  }, [track, focussedAnimation, actionOpacityAnimation, touchStartPosition]);

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
      <View
        className="h-full justify-center"
        style={{ backgroundColor: theme["900"], opacity: 0.95 }}
      >
        <LinearGradient className="flex-1 justify-center" colors={upVoteGradient}>
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

interface Props {
  onTouchEnd?: (event: GestureResponderEvent) => void;
  getTrackVotes: (track: SpotifyApi.TrackObjectFull) => number | undefined;
}
