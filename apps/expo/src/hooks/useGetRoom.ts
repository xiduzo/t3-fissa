import { api } from "../utils";

export const useGetRoom = (pin: string) => {
  return api.room.byId.useQuery(pin, {
    refetchInterval: 2500,
    enabled: !!pin,
  });
};

export const useGetRoomDetails = (pin: string) => {
  return api.room.detailsById.useQuery(pin, {
    refetchInterval: 2500,
    enabled: !!pin,
  });
};
