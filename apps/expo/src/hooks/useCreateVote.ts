import { notificationAsync, NotificationFeedbackType } from "expo-haptics";

import { api } from "../utils";

export const useCreateVote = (pin: string) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = api.vote.create.useMutation({
    onMutate: async ({ pin, trackId, vote }) => {
      await queryClient.fissa.byId.cancel(pin);

      const previousVote = queryClient.vote.byTrackFromUser.getData({ pin, trackId });

      queryClient.vote.byTrackFromUser.setData({ pin, trackId }, () => ({
        pin,
        trackId,
        vote,
        userId: "", // Does not matter, will be set on the server
      }));

      queryClient.fissa.byId.setData(
        pin,
        (prev) =>
          prev && {
            ...prev,
            tracks: prev.tracks.map((track) => {
              if (track.trackId === trackId) {
                track.score += vote - (previousVote?.vote ?? 0);
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
    onSettled: async (_data, _, { pin, trackId }) => {
      await queryClient.fissa.byId.invalidate(pin);
      await queryClient.vote.byTrackFromUser.invalidate({ pin, trackId });
    },
  });

  return {
    ...rest,
    mutate: (vote: number, trackId: string) => mutate({ pin, trackId, vote }),
    mutateAsync: async (vote: number, trackId: string) => mutateAsync({ pin, trackId, vote }),
  };
};
