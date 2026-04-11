import { useContext, useEffect, useMemo, useRef, type FC } from "react";
import { Animated, Dimensions, Modal, StyleSheet, type GestureResponderEvent } from "react-native";
import { selectionAsync } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed } from "@fissa/utils";

import { Action, Badge, TrackEnd, TrackListItem } from "../shared";
import { QuickVoteContext } from "./QuickVoteContext";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const QuickVoteModal: FC<Props> = ({ onTouchEnd, getTrackVotes, userVoteMap }) => {
  const { vote, touchStartPosition, track } = useContext(QuickVoteContext);

  const focussedAnimation = useRef(new Animated.Value(0)).current;
  const actionOpacityAnimation = useRef(new Animated.Value(0)).current;

  const userVote = track ? userVoteMap?.get(track.id) : undefined;

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

    void selectionAsync();
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
    const isUpVote = vote === 1 || (userVote === 1 && vote !== -1);

    return [theme[isUpVote ? "100" : "900"] + "20", theme["900"] + "10"] as const;
  }, [vote, userVote]);

  const downVoteGradient = useMemo(() => {
    const isDownVote = vote === -1 || (userVote === -1 && vote !== 1);

    return [theme["900"] + "10", theme[isDownVote ? "100" : "900"] + "20"] as const;
  }, [vote, userVote]);

  return (
    <Modal
      transparent
      visible={!!track}
      // Redundant exit touch event
      // This should be handled by the track `onTouchEnd`
      // But if the track doesn't fire the user still needs a way out
      onTouchEnd={onTouchEnd}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: theme["900"], opacity, flex: 1, justifyContent: "center" },
        ]}
      >
        <LinearGradient style={{ flex: 1, justifyContent: "center" }} colors={upVoteGradient}>
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
              active={userVote === 1}
            />
          </Animated.View>
        </LinearGradient>
        <Animated.View className="px-6" style={{ top: focussedAnimation }}>
          {track && (
            <TrackListItem
              track={track}
              subtitlePrefix={<Badge amount={getTrackVotes(track)} />}
              end={<TrackEnd vote={userVote} />}
            />
          )}
        </Animated.View>
        <LinearGradient style={{ flex: 1, justifyContent: "center" }} colors={downVoteGradient}>
          <Animated.View
            style={{
              opacity: actionOpacityAnimation,
              transform: [{ scale: scale }],
            }}
          >
            <Action
              layout="column"
              reversed
              active={userVote === -1}
              icon="arrow-down"
              title="Down-vote song"
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

interface Props {
  onTouchEnd?: (event: GestureResponderEvent) => void;
  getTrackVotes: (track: SpotifyApi.TrackObjectFull) => number | undefined;
  userVoteMap?: Map<string, number>;
}
