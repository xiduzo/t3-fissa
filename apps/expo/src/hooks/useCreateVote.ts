import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.vote.create.useMutation;

export const useCreateVoteForTrack = (
  pin: string,
  trackId: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onMutate: async (newVote) => {
      await queryClient.vote.byTrackFromUser.cancel(newVote);

      const vote = {
        pin: newVote.pin,
        trackId: newVote.trackId,
      };
      const previousVote = queryClient.vote.byTrackFromUser.getData(vote);

      // TODO: also update the track's score
      queryClient.vote.byTrackFromUser.setData(vote, (prev) => {
        return {
          ...prev,
          ...newVote,
          userId: "optimistic",
        };
      });

      await callbacks.onMutate?.(newVote);
      return previousVote;
    },
    onSettled: async (data, error, variables, context) => {
      const vote = error ? context : data;
      queryClient.vote.byTrackFromUser.setData(variables, () => vote);
    },
  });

  return {
    ...rest,
    mutate: async (vote: number) => mutate({ pin, trackId, vote }),
    mutateAsync: async (vote: number) => mutateAsync({ pin, trackId, vote }),
  };
};

export const useCreateVote = (
  pin: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onMutate: async (newVote) => {
      await queryClient.vote.byTrackFromUser.cancel(newVote);

      const vote = {
        pin: newVote.pin,
        trackId: newVote.trackId,
      };
      const previousVote = queryClient.vote.byTrackFromUser.getData(vote);

      queryClient.vote.byTrackFromUser.setData(vote, (prev) => {
        return {
          ...prev,
          ...newVote,
          userId: "optimistic",
        };
      });

      await callbacks.onMutate?.(newVote);
      return previousVote;
    },
    onSettled: async (data, error, variables, context) => {
      const vote = error ? context : data;
      queryClient.vote.byTrackFromUser.setData(variables, () => vote);
    },
  });

  return {
    ...rest,
    mutate: async (vote: number, trackId: string) =>
      mutate({ pin, trackId, vote }),
    mutateAsync: async (vote: number, trackId: string) =>
      mutateAsync({ pin, trackId, vote }),
  };
};
