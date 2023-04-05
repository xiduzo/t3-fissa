import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.room.restart.useMutation;

export const useRestartRoom = (
  pin: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onSuccess: async (...props) => {
      callbacks.onSuccess?.(...props);
      queryClient.room.invalidate();
    },
  });

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
