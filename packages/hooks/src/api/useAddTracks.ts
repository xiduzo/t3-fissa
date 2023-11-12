import { sortFissaTracksOrder, type MutationCallbacks } from "@fissa/utils";

import { api } from "./api";

const endpoint = api.track.addTracks.useMutation;

export const useAddTracks = (pin: string, callbacks: MutationCallbacks<typeof endpoint> = {}) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onMutate: async (variables) => {
      const newTrackIds = variables.tracks.map((track) => track.trackId);
      await queryClient.fissa.byId.cancel(variables.pin);
      queryClient.fissa.byId.setData(
        variables.pin,
        (prev) =>
          prev && {
            ...prev,
            tracks: sortFissaTracksOrder([
              ...variables.tracks.map((track) => ({
                by: null,
                lastUpdateAt: new Date(),
                createdAt: new Date(),
                hasBeenPlayed: false,
                score:
                  (prev.tracks.find(({ trackId }) => trackId === track.trackId)?.score ?? 0) + 1,
                pin: variables.pin,
                trackId: track.trackId,
                durationMs: track.durationMs,
                totalScore: 0,
                userId: null,
              })),
              ...prev.tracks.filter(({ trackId }) => !newTrackIds.includes(trackId)),
            ]),
          },
      );

      variables.tracks.forEach((track) => {
        const vote = { trackId: track.trackId, pin: variables.pin };

        queryClient.vote.byTrackFromUser.setData(
          vote,
          (prev) =>
            prev && {
              ...prev,
              vote: 1,
            },
        );
      });

      await callbacks.onMutate?.(variables);
    },
    onSettled: async (data, error, variables, context) => {
      for (const track of variables.tracks) {
        const vote = { trackId: track.trackId, pin: variables.pin };

        await queryClient.vote.byTrackFromUser.invalidate(vote);
      }

      await queryClient.fissa.byId.invalidate(variables.pin);
      await callbacks.onSettled?.(data, error, variables, context);
    },
  });

  return {
    ...rest,
    mutate: (tracks: SpotifyApi.TrackObjectFull[]) =>
      mutate({
        pin,
        tracks: tracks.map((track) => ({
          trackId: track.id,
          durationMs: track.duration_ms,
        })),
      }),
    mutateAsync: (tracks: SpotifyApi.TrackObjectFull[]) =>
      mutateAsync({
        pin,
        tracks: tracks.map((track) => ({
          trackId: track.id,
          durationMs: track.duration_ms,
        })),
      }),
  };
};
