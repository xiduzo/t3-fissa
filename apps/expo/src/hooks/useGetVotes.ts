import { api } from "../utils";

export const useGetVotes = (roomId: string) => {
  return api.vote.byRoom.useQuery(roomId, {
    enabled: !!roomId,
    refetchInterval: 5000,
  });
};
