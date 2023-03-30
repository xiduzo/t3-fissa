import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.vote.create.useMutation;

export const useCreateVote = (
  pin: string,
  trackId: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onSuccess: async (...props) => {
      await queryClient.vote.invalidate();
      await queryClient.room.byId.invalidate();
      callbacks.onSuccess?.(...props);
    },
  });

  return {
    // TODO get vote type from BE
    mutate: async (vote: number) => mutate({ pin, trackId, vote }),
    mutateAsync: async (vote: number) => mutateAsync({ pin, trackId, vote }),
    ...rest,
  };
};
