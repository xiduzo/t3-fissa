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
    onSuccess: async (...props) => {
      callbacks.onSuccess?.(...props);
      queryClient.vote.invalidate();
      queryClient.fissa.byId.invalidate();
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
    onSuccess: async (...props) => {
      callbacks.onSuccess?.(...props);
      queryClient.vote.invalidate();
      queryClient.fissa.byId.invalidate();
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
