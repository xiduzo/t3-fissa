import { type MutationCallbacks } from "@fissa/utils";

import { api } from "./api";

const endpoint = api.fissa.restart.useMutation;

export const useRestartFissa = (pin: string, callbacks: MutationCallbacks<typeof endpoint> = {}) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onSuccess: async (...props) => {
      await queryClient.fissa.invalidate();
      callbacks.onSuccess?.(...props);
    },
  });

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
