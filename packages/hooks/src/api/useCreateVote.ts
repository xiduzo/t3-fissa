import { type MutationCallbacks } from "@fissa/utils";

import { api } from "./api";

const endpoint = api.vote.create.useMutation;

export const useCreateVote = (pin: string, callbacks: MutationCallbacks<typeof endpoint> = {}) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onMutate: async (newVote) => {
      await queryClient.vote.byTrackFromUser.cancel(newVote);
      await queryClient.fissa.byId.cancel(newVote.pin);

      const vote = {
        pin: newVote.pin,
        trackId: newVote.trackId,
      };
      const previousVote = queryClient.vote.byTrackFromUser.getData(vote);

      queryClient.vote.byTrackFromUser.setData(
        vote,
        (prev) =>
          prev && {
            ...prev,
            ...newVote,
          },
      );

      queryClient.fissa.byId.setData(
        newVote.pin,
        (prev) =>
          prev && {
            ...prev,
            tracks: prev.tracks.map((track) => {
              if (track.trackId === newVote.trackId) {
                return {
                  ...track,
                  score: track.score + newVote.vote - (previousVote?.vote ?? 0),
                };
              }
              return track;
            }),
          },
      );

      await callbacks.onMutate?.(newVote);

      return previousVote;
    },
    onSettled: async (data, error, variables, context) => {
      await queryClient.fissa.byId.invalidate(variables.pin);
      await queryClient.vote.byTrackFromUser.invalidate({
        pin: variables.pin,
        trackId: variables.trackId,
      });
      await callbacks.onSettled?.(data, error, variables, context);
    },
  });

  return {
    ...rest,
    mutate: (vote: number, trackId: string) => mutate({ pin, trackId, vote }),
    mutateAsync: async (vote: number, trackId: string) => mutateAsync({ pin, trackId, vote }),
  };
};
