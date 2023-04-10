import { FC, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useSearchParams } from "expo-router";

import { useCreateVoteForTrack, useGetVoteFromUser } from "../../../hooks";
import { useAuth } from "../../../providers";
import { Action } from "../../shared";

export const VoteActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const { data } = useGetVoteFromUser(String(pin), track.id, user);

  const { mutateAsync, isLoading } = useCreateVoteForTrack(
    String(pin),
    track.id,
    {
      onMutate: ({ vote }) => {
        Haptics.notificationAsync(
          vote > 0
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
      },
    },
  );

  const handleVote = useCallback(
    (vote: number) => async () => {
      onPress();
      await mutateAsync(vote);
    },
    [],
  );

  return (
    <>
      <Action
        onPress={handleVote(1)}
        inverted
        active={data?.vote === 1}
        disabled={isLoading || data?.vote === 1}
        icon="arrow-up"
        title="Up-vote track"
        subtitle="It might move up in the queue"
      />

      <Action
        onPress={handleVote(-1)}
        inverted
        active={data?.vote === -1}
        disabled={isLoading || data?.vote === -1}
        icon="arrow-down"
        title="Down-vote track"
        subtitle="It might move down in the queue"
      />
    </>
  );
};

interface Props {
  track: SpotifyApi.TrackObjectFull;
  onPress: () => void;
}
