import { api } from "../utils";

export const useGetRoom = (pin: string) => {
  return api.room.byId.useQuery(pin, {
    refetchInterval: 5000,
    enabled: !!pin,
  });
};
