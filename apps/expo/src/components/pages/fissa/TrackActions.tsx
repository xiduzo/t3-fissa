import React, { useCallback, useMemo, type FC } from "react";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useSearchParams } from "expo-router";
import {
  useCreateVote,
  useDeleteTrack,
  useGetFissa,
  useGetVoteFromUser,
  useIsOwner,
  useSkipTrack,
} from "@fissa/hooks";

import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Action } from "../../shared";

export const TrackActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();
  const { data: fissa } = useGetFissa(String(pin));

  const isOwner = useIsOwner(String(pin));

  const { user } = useAuth();

  const { data } = useGetVoteFromUser(String(pin), track.id, user);

  const { mutateAsync: voteOnTrack, isLoading: isVoting } = useCreateVote(String(pin), {
    onMutate: async ({ vote }) => {
      await notificationAsync(NotificationFeedbackType[vote > 0 ? "Success" : "Warning"]);
    },
  });

  const { mutateAsync: deleteTrack, isLoading: isDeleting } = useDeleteTrack(
    String(pin),
    track.id,
    {
      onSettled: async () => {
        await notificationAsync(NotificationFeedbackType.Success);
      },
    },
  );

  const { mutateAsync: skipTrack, isLoading: isSkipping } = useSkipTrack(String(pin), {
    onMutate: () => {
      onPress();
      toast.info({
        icon: "🐍",
        message: "Ssssssssskipping song",
      });
    },
    onSettled: () => {
      toast.hide();
    },
  });

  const isActiveTrack = useMemo(() => fissa?.currentlyPlayingId === track.id, [fissa, track.id]);

  const hasBeenPlayed = useMemo(
    () => fissa?.tracks.find(({ trackId }) => trackId === track?.id)?.hasBeenPlayed,
    [track?.id, fissa?.tracks],
  );

  const canRemoveTrack = useMemo(() => {
    const isAddedByUser =
      fissa?.tracks.find(({ trackId }) => trackId === track?.id)?.by?.email === user?.id;

    if (isAddedByUser) return true;

    return isOwner;
  }, [track?.id, fissa?.tracks, user, isOwner]);

  const handleVote = useCallback(
    (vote: number) => async () => {
      onPress();
      await voteOnTrack(vote, track.id);
    },
    [track.id, voteOnTrack, onPress],
  );

  const handleDelete = useCallback(async () => {
    onPress();
    await deleteTrack();
  }, [deleteTrack, onPress]);

  const handleSkipTrack = useCallback(async () => {
    onPress();
    await skipTrack();
  }, [skipTrack, onPress]);

  return (
    <>
      {hasBeenPlayed && (
        <Action
          onPress={handleVote(1)}
          inverted
          icon="sync"
          title="Replay song"
          subtitle="What a banger this was!"
        />
      )}
      {!isActiveTrack && !hasBeenPlayed && (
        <Action
          onPress={handleVote(1)}
          inverted
          active={data?.vote === 1}
          disabled={isVoting || data?.vote === 1}
          icon="arrow-up"
          title="Up-vote song"
          subtitle="It might move up in the queue"
        />
      )}
      {canRemoveTrack && !isActiveTrack && !hasBeenPlayed && (
        <Action
          inverted
          onPress={handleDelete}
          icon="trash"
          disabled={isDeleting}
          title="Remove song"
          subtitle="Mistakes were made"
        />
      )}
      {isActiveTrack && !hasBeenPlayed && (
        <Action
          title="Skip song"
          subtitle={isOwner ? "Use your powers wisely" : "Poke your host to skip"}
          inverted
          disabled={!isOwner || isSkipping}
          onPress={handleSkipTrack}
          icon="skip-forward"
        />
      )}
      {!isActiveTrack && !hasBeenPlayed && (
        <Action
          onPress={handleVote(-1)}
          inverted
          active={data?.vote === -1}
          disabled={isVoting || data?.vote === -1}
          icon="arrow-down"
          title="Down-vote song"
          subtitle="It might move down in the queue"
        />
      )}
    </>
  );
};

interface Props {
  track: SpotifyApi.TrackObjectFull;
  onPress: () => void;
}
