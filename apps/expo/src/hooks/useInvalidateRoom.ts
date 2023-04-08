import { api } from "../utils";

export const useInvalidateRoom = () => {
  const queryClient = api.useContext();

  return queryClient.room.byId.invalidate;
};
