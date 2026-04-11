import { notificationAsync, NotificationFeedbackType } from "expo-haptics";

import { api } from "../utils";

export const useCreateVote = (pin: string) => {
  const queryClient = api.useUtils();

  const { mutate, mutateAsync, ...rest } = api.vote.create.useMutation({
    onMutate: async ({ pin, trackId, vote }) => {
      await queryClient.fissa.byId.cancel(pin);

      const previousVotes = queryClient.vote.byFissaFromUser.getData(pin);

      // Optimistically update the batched user votes
      queryClient.vote.byFissaFromUser.setData(pin, (prev) => {
        if (!prev) return prev;
        const existing = prev.find((v) => v.trackId === trackId);
        if (existing) {
          return prev.map((v) => (v.trackId === trackId ? { ...v, vote } : v));
        }
        return [...prev, { pin, trackId, vote, userId: "" }];
      });

      queryClient.fissa.byId.setData(
        pin,
        (prev) =>
          prev && {
            ...prev,
            tracks: prev.tracks.map((track) => {
              if (track.trackId === trackId) {
                const previousVote = previousVotes?.find((v) => v.trackId === trackId)?.vote ?? 0;
                track.score += vote - previousVote;
                // Replaying a track just gives it a vote,
                // Make sure to reset the hasBeenPlayed flag
                track.hasBeenPlayed = false;
              }
              return track;
            }),
          },
      );

      await notificationAsync(NotificationFeedbackType[vote > 0 ? "Success" : "Warning"]);
    },
    onSettled: async (_data, _, { pin }) => {
      await queryClient.fissa.byId.invalidate(pin);
      await queryClient.vote.byFissaFromUser.invalidate(pin);
    },
  });

  return {
    ...rest,
    mutate: (vote: number, trackId: string) => mutate({ pin, trackId, vote }),
    mutateAsync: async (vote: number, trackId: string) => mutateAsync({ pin, trackId, vote }),
  };
};
