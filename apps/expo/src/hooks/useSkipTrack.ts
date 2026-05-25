import { api, toast } from "../utils";

export const useSkipTrack = (
  pin: string,
  options: Parameters<typeof api.fissa.skipTrack.useMutation>[0] = {},
) => {
  const queryClient = api.useUtils();

  const { mutate, mutateAsync, ...rest } = api.fissa.skipTrack.useMutation({
    ...options,
    onSuccess: async (...args) => {
      await queryClient.fissa.byId.invalidate();
      options.onSuccess?.(...args);
    },
    onMutate: (...args) => {
      toast.info({
        icon: "🐍",
        message: "Ssssssssskipping song",
      });

      return options.onMutate?.(...args);
    },
    onSettled: (...args) => {
      toast.hide();

      options.onSettled?.(...args);
    },
  });

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
