import { api, toast } from "../utils";

export const useSkipTrack = (
  pin: string,
  options: Parameters<typeof api.fissa.skipTrack.useMutation>[0] = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = api.fissa.skipTrack.useMutation({
    ...options,
    onSuccess: async (...props) => {
      await queryClient.fissa.byId.invalidate();
      options.onSuccess?.(...props);
    },
    onMutate(variables) {
      toast.info({
        icon: "🐍",
        message: "Ssssssssskipping song",
      });

      options.onMutate?.(variables);
    },
    onSettled(data, error, variables, context) {
      toast.hide();

      options.onSettled?.(data, error, variables, context);
    },
  });

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
