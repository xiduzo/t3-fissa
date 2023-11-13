import { type MutationCallbacks } from "@fissa/utils";

import { api } from "./api";

const endpoint = api.fissa.pause.useMutation;

export const usePauseFissa = (pin: string, callbacks: MutationCallbacks<typeof endpoint> = {}) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onSuccess: async (data, variables, context) => {
      await queryClient.fissa.invalidate();
      callbacks.onSuccess?.(data, variables, context);
    },
  });

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
