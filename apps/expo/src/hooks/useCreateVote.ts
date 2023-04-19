import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.vote.create.useMutation;

export const useCreateVote = (
  pin: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
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

      queryClient.vote.byTrackFromUser.setData(vote, (prev) => ({
        ...prev,
        ...newVote,
        userId: "optimistic",
      }));

      queryClient.fissa.byId.setData(newVote.pin, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev?.tracks.map((track) => {
            if (track.trackId === newVote.trackId) {
              return {
                ...track,
                score: track.score + newVote.vote - (previousVote?.vote ?? 0),
              };
            }
            return track;
          }),
        };
      });

      await callbacks.onMutate?.(newVote);

      return previousVote;
    },
    onSettled: async (data, error, variables, context) => {
      const vote = error ? context : data;
      queryClient.vote.byTrackFromUser.setData(variables, vote);
      await queryClient.fissa.byId.invalidate(variables.pin);
      await queryClient.vote.byTrackFromUser.invalidate({
        pin: variables.pin,
        trackId: variables.trackId,
      });
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
