import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";

const endpoint = api.track.addTracks.useMutation;

export const useAddTracks = (
  roomId: string,
  callbacks: MutationCallbacks<typeof endpoint> = {},
) => {
  const queryClient = api.useContext();

  const { mutate, mutateAsync, ...rest } = endpoint({
    ...callbacks,
    onSuccess: async (...props) => {
      await queryClient.track.byRoomId.invalidate();
      callbacks.onSuccess?.(...props);
    },
  });

  return {
    mutate: (tracks: SpotifyApi.TrackObjectFull[]) =>
      mutate({
        roomId,
        tracks: tracks.map((track) => ({
          trackId: track.id,
          durationMs: track.duration_ms,
        })),
      }),
    mutateAsync: (tracks: SpotifyApi.TrackObjectFull[]) =>
      mutateAsync({
        roomId,
        tracks: tracks.map((track) => ({
          trackId: track.id,
          durationMs: track.duration_ms,
        })),
      }),
    ...rest,
  };
};
