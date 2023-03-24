import { api } from "../utils";

export const useGetRoom = (roomId: string) => {
  return api.room.byId.useQuery(roomId!, {
    refetchInterval: 5000,
  });
};
