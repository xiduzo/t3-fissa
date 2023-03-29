import { api } from "../utils";

export const useGetVoteFromUser = (
  roomId: string,
  trackId: string,
  user?: unknown,
) => {
  return api.vote.byTrackFromUser.useQuery(
    { roomId, trackId },
    {
      enabled: !!user,
    },
  );
};
