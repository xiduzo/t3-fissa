import { FC, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { useSearchParams } from "expo-router";
import { useCreateVote, useDeleteTrack, useGetFissa, useGetVoteFromUser } from "@fissa/hooks";

import { useAuth } from "../../../providers";
import { Action } from "../../shared";

export const TrackActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();
  const { data: fissa } = useGetFissa(String(pin));

  const { user } = useAuth();

  const { data } = useGetVoteFromUser(String(pin), track.id, user);

  const { mutateAsync: voteOnTrack, isLoading } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(
        vote > 0 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
    },
  });

  const { mutateAsync: deleteTrack } = useDeleteTrack(String(pin), track.id, {
    onSettled: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const canRemoveTrack = useMemo(() => {
    const isAddedByUser = fissa?.tracks.find(({ trackId }) => trackId === track.id)?.by?.email === user?.id;

    if (isAddedByUser) return true;

    return fissa?.by.email === user?.email;
  }, [fissa, user]);

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
  }, [deleteTrack]);

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
      {canRemoveTrack && (
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
}
