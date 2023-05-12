import { FC, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useSearchParams } from "expo-router";
import {
  useCreateVote,
  useDeleteTrack,
  useGetVoteFromUser,
} from "@fissa/hooks";

import { useAuth } from "../../../providers";
import { Action } from "../../shared";

export const TrackActions: FC<Props> = ({ track, onPress, addedByEmail }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const { data } = useGetVoteFromUser(String(pin), track.id, user);

  const { mutateAsync: voteOnTrack, isLoading } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(
        vote > 0
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    },
  });

  const { mutateAsync: deleteTrack } = useDeleteTrack(String(pin), track.id, {
    onSettled: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleVote = useCallback(
    (vote: number) => async () => {
      onPress();
      await voteOnTrack(vote, track.id);
    },
    [track.id, voteOnTrack],
  );

  const handleDelete = useCallback(async () => {
    onPress();
    await deleteTrack();
  }, [track.id, deleteTrack]);

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
      {addedByEmail === user?.email && (
        <Action
          inverted
          onPress={handleDelete}
          icon="trash"
          title="Remove song"
          subtitle="Mistakes were made"
        />
      )}
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
  addedByEmail?: string | null;
}
