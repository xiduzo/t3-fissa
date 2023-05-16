import { useCallback, useContext, useEffect } from "react";
import { Dimensions, GestureResponderEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useCreateVote } from "@fissa/hooks";

import { QuickVoteContext } from "./QuickVoteContext";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const useQuickVote = (pin: string) => {
  const { track, vote, setVote, selectTrack } = useContext(QuickVoteContext);

  const { mutateAsync } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType[vote > 0 ? "Success" : "Warning"]);
    },
  });

  const toggleTrackFocus = useCallback(
    (track?: SpotifyApi.TrackObjectFull) => async (event: GestureResponderEvent) => {
      selectTrack(event, track);
    },
    [selectTrack],
  );

  const handleTouchEnd = useCallback(
    async (event: GestureResponderEvent) => {
      if (vote !== 0 && track) mutateAsync(vote, track.id);

      await toggleTrackFocus()(event);
    },
    [toggleTrackFocus, track, vote],
  );

  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!track) return;

      const TRIGGER_DIFF = 100;

      const { pageY } = event.nativeEvent;

      if (pageY < windowCenter - TRIGGER_DIFF) {
        return setVote(1);
      }

      if (pageY > windowCenter + TRIGGER_DIFF) {
        return setVote(-1);
      }

      setVote(0);
    },
    [track],
  );

  useEffect(() => {
    return () => setVote(0);
  }, []);

  return {
    isVoting: !!track,
    handleTouchMove,
    handleTouchEnd,
    toggleTrackFocus,
  };
};
