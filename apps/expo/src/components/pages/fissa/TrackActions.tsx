import React, { FC, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { useSearchParams } from "expo-router";
import {
  useCreateVote,
  useDeleteTrack,
  useGetFissa,
  useGetVoteFromUser,
  useSkipTrack,
} from "@fissa/hooks";

import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Action } from "../../shared";

export const TrackActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();
  const { data: fissa } = useGetFissa(String(pin));

  const { user } = useAuth();

  const { data } = useGetVoteFromUser(String(pin), track.id, user);

  const { mutateAsync: voteOnTrack, isLoading: isVoting } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      Haptics.notificationAsync(
        vote > 0
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    },
  });

  const { mutateAsync: deleteTrack, isLoading: isDeleting } = useDeleteTrack(
    String(pin),
    track.id,
    {
      onSettled: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const isActiveTrack = useMemo(() => {
    return fissa?.currentlyPlayingId === track.id;
  }, [fissa]);

  const isOwner = useMemo(() => fissa?.by.email === user?.email, [fissa?.by, user]);

  const canRemoveTrack = useMemo(() => {
    const isAddedByUser =
      fissa?.tracks.find(({ trackId }) => trackId === track.id)?.by?.email === user?.id;

    if (isAddedByUser) return true;

    return isOwner;
  }, [fissa?.tracks, user, isOwner]);

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

  const handleSkipTrack = useCallback(async () => {
    onPress();
    await skipTrack();
  }, [skipTrack]);

  if (!fissa) return null;

  return (
    <>
      {!isActiveTrack && (
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
      {canRemoveTrack && !isActiveTrack && (
        <Action
          inverted
          onPress={handleDelete}
          icon="trash"
          disabled={isDeleting}
          title="Remove song"
          subtitle="Mistakes were made"
        />
      )}
      {isActiveTrack && (
        <Action
          title="Skip song"
          subtitle={isOwner ? "Skip the current song" : "Poke your host to skip"}
          inverted
          disabled={!isOwner || isSkipping}
          onPress={handleSkipTrack}
          icon="magic"
        />
      )}
      {!isActiveTrack && (
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
