import { FC, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useSearchParams } from "expo-router";

import { useCreateVote, useGetVoteFromUser } from "../../../hooks";
import { useAuth } from "../../../providers";
import { Action } from "../../shared";

export const VoteActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const { data } = useGetVoteFromUser(String(pin), track.id, user);

  const { mutateAsync, isLoading } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(
        vote > 0
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    },
  });

  const handleVote = useCallback(
    (vote: number) => async () => {
      onPress();
      await mutateAsync(vote, track.id);
    },
    [track.id],
  );

  return (
    <>
      <Action
        onPress={handleVote(1)}
        inverted
        active={data?.vote === 1}
        disabled={isLoading || data?.vote === 1}
        icon="arrow-up"
        title="Up-vote song"
        subtitle="It might move up in the queue"
      />
      {/* <Action
        inverted
        disabled
        icon="remove"
        title="Remove song"
        subtitle="Mistakes were made"
      /> */}
      <Action
        onPress={handleVote(-1)}
        inverted
        active={data?.vote === -1}
        disabled={isLoading || data?.vote === -1}
        icon="arrow-down"
        title="Down-vote song"
        subtitle="It might move down in the queue"
      />
    </>
  );
};

interface Props {
  track: SpotifyApi.TrackObjectFull;
  onPress: () => void;
}
