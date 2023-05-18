import { api } from "./api";

export const useGetVoteFromUser = (pin: string, trackId: string, user?: unknown) => {
  return api.vote.byTrackFromUser.useQuery(
    { pin, trackId },
    {
      enabled: !!user && !!trackId,
    },
  );
};
