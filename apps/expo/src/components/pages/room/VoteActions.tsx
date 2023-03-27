import { FC, useCallback } from "react";
import { useSearchParams } from "expo-router";

import { useCreateVote } from "../../../hooks";
import { toast } from "../../../utils";
import { Action } from "../../shared";

export const VoteActions: FC<Props> = ({ track, onPress }) => {
  const { pin } = useSearchParams();

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
      <Action
        onPress={handleVote("UP")}
        inverted
        disabled={isLoading}
        icon="arrow-up"
        title="Up-vote track"
        subtitle="It might move up in the queue"
      />

      <Action
        onPress={handleVote("DOWN")}
        inverted
        disabled={isLoading}
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
