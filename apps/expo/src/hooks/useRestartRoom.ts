import { api } from "../utils";

const endpoint = api.room.restart.useMutation;

export const useRestartRoom = (pin: string) => {
  const { mutate, mutateAsync, ...rest } = endpoint();

  return {
    ...rest,
    mutate: () => mutate(pin),
    mutateAsync: async () => mutateAsync(pin),
  };
};
