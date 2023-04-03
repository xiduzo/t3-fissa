import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.room.skipTrack.useMutation;

export const useSkipTrack = (
  pin: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    onSuccess: async (...props) => {
      await queryClient.room.byId.invalidate();
      callbacks.onSuccess?.(...props);
    },
  });

  return {
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
    ...rest,
  };
};
