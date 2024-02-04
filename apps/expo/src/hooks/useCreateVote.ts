import { notificationAsync, NotificationFeedbackType } from "expo-haptics";

import { api } from "../utils";

export const useCreateVote = (pin: string) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = api.vote.create.useMutation({
    onMutate: async (newVote) => {
      await queryClient.vote.byTrackFromUser.cancel(newVote);
      await queryClient.fissa.byId.cancel(newVote.pin);

      const vote = {
        pin: newVote.pin,
        trackId: newVote.trackId,
      };
      const previousVote = queryClient.vote.byTrackFromUser.getData(vote);

      queryClient.vote.byTrackFromUser.setData(
        vote,
        (prev) =>
          prev && {
            ...prev,
            ...newVote,
          },
      );

      queryClient.fissa.byId.setData(
        newVote.pin,
        (prev) =>
          prev && {
            ...prev,
            tracks: prev.tracks.map((track) => {
              if (track.trackId === newVote.trackId) {
                return {
                  ...track,
                  score: track.score + newVote.vote - (previousVote?.vote ?? 0),
                };
              }
              return track;
            }),
          },
      );

      await notificationAsync(NotificationFeedbackType[newVote.vote > 0 ? "Success" : "Warning"]);

      return previousVote;
    },
    onSettled: async (data, _, variables) => {
      await queryClient.fissa.byId.invalidate(variables.pin);
      await queryClient.vote.byTrackFromUser.invalidate({
        pin: variables.pin,
        trackId: variables.trackId,
      });
    },
  });

  return {
    ...rest,
    mutate: (vote: number, trackId: string) => mutate({ pin, trackId, vote }),
    mutateAsync: async (vote: number, trackId: string) => mutateAsync({ pin, trackId, vote }),
  };
};
