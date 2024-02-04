import { useCallback, useContext, useEffect } from "react";
import { Dimensions, type GestureResponderEvent } from "react-native";

import { useCreateVote } from "../../hooks";
import { QuickVoteContext } from "./QuickVoteContext";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const useQuickVote = (pin: string) => {
  const { track, vote, setVote, selectTrack } = useContext(QuickVoteContext);

  const { mutateAsync } = useCreateVote(String(pin));

  const toggleTrackFocus = useCallback(
    (track?: SpotifyApi.TrackObjectFull) => (event: GestureResponderEvent) => {
      selectTrack(event, track);
    },
    [selectTrack],
  );

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      if (vote !== 0 && track) void mutateAsync(vote, track.id);

      toggleTrackFocus()(event);
    },
    [toggleTrackFocus, track, vote, mutateAsync],
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
    [track, setVote],
  );

  useEffect(() => {
    return () => setVote(0);
  }, [setVote]);

  return {
    isVoting: !!track,
    handleTouchMove,
    handleTouchEnd,
    toggleTrackFocus,
  };
};
