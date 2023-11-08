import { type MutationCallbacks } from "@fissa/utils";

import { api } from "./api";

const endpoint = api.fissa.skipTrack.useMutation;

export const useSkipTrack = (pin: string, callbacks: MutationCallbacks<typeof endpoint> = {}) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onSuccess: async (...props) => {
      await queryClient.fissa.byId.invalidate();
      callbacks.onSuccess?.(...props);
    },
  });

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
