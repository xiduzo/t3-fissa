import { api } from "../utils";

export const useGetVotes = (pin: string) => {
  return api.vote.byRoom.useQuery(pin, {
    enabled: !!pin,
    refetchInterval: 5000,
  });
};
