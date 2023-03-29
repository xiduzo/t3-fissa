import { FC, useCallback } from "react";
import { useSearchParams } from "expo-router";

import { useCreateVote } from "../../../hooks";
import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Action, Button, Divider, Typography } from "../../shared";

export const VoteActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();
  const { user, promptAsync } = useAuth();

  const { mutateAsync, isLoading } = useCreateVote(pin!, track.id, {
    onSuccess: () => {
      toast.success({ message: `Voted for ${track.name}` });
      onPress();
    },
  });

  const handleVote = useCallback(
    (vote: "UP" | "DOWN") => async () => {
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
        onPress={handleVote("UP")}
        inverted
        disabled={isLoading || !user}
        icon="arrow-up"
        title="Up-vote track"
        subtitle="It might move up in the queue"
      />

      <Action
        onPress={handleVote("DOWN")}
        inverted
        disabled={isLoading || !user}
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
