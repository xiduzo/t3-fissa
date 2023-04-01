import { FC, useCallback } from "react";
import { useSearchParams } from "expo-router";

import { useCreateVote, useGetVoteFromUser } from "../../../hooks";
import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Action, Button } from "../../shared";

export const VoteActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();
  const { user, promptAsync } = useAuth();

  const { data } = useGetVoteFromUser(pin!, track.id, user);

  const { mutateAsync, isLoading } = useCreateVote(pin!, track.id, {
    onSuccess: ({ vote }) => {
      toast.success({
        message: track.name,
        icon: vote > 0 ? "👆" : "👇",
      });
    },
  });

  const handleVote = useCallback(
    (vote: number) => async () => {
      onPress();
      await mutateAsync(vote);
    },
    [],
  );

  return (
    <>
      {!user && (
        <Button
          inverted
          variant="text"
          title="Sign in to vote"
          className="my-4"
          onPress={() => promptAsync()}
        />
      )}
      <Action
        onPress={handleVote(1)}
        inverted
        active={data?.vote === 1}
        disabled={isLoading || !user || data?.vote === 1}
        icon="arrow-up"
        title="Up-vote track"
        subtitle="It might move up in the queue"
      />

      <Action
        onPress={handleVote(-1)}
        inverted
        active={data?.vote === -1}
        disabled={isLoading || !user || data?.vote === -1}
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
