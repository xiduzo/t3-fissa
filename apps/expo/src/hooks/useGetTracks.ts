import { api } from "../utils";

export const useGetTracks = (roomId: string) => {
  return api.track.byRoomId.useQuery(roomId, {
    enabled: !!roomId,
    refetchInterval: 5000,
  });
};
