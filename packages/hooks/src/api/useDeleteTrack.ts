import { type MutationCallbacks } from "@fissa/utils";

import { api } from "./api";

const endpoint = api.track.deleteTrack.useMutation;

export const useDeleteTrack = (
  pin: string,
  trackId: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onMutate: async (variables) => {
      await queryClient.fissa.byId.invalidate(variables.pin);

      queryClient.fissa.byId.setData(variables.pin, (prev) => prev && ({
        ...prev,
        tracks: [...prev.tracks.filter(({ trackId }) => trackId !== variables.trackId)],
      }));

      await callbacks.onMutate?.(variables);
    },
    onSettled: async (data, error, variables, context) => {
      await queryClient.fissa.byId.invalidate(variables.pin);
      await callbacks.onSettled?.(data, error, variables, context);
    },
  });

  return {
    ...rest,
    mutate: () => mutate({ pin, trackId }),
    mutateAsync: () => mutateAsync({ pin, trackId }),
  };
};
