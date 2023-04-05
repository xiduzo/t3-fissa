import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.room.skipTrack.useMutation;

export const useSkipTrack = (
  pin: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onSuccess: (...props) => {
      queryClient.room.byId.invalidate();
      callbacks.onSuccess?.(...props);
    },
  });

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
