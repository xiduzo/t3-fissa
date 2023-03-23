import { MutationCallbacks } from "@fissa/utils";

import { api } from "../utils";
import { Track } from ".prisma/client";

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
    mutate: (tracks: Omit<Track, "index" | "roomId">[]) =>
      mutate({ roomId, tracks }),
    mutateAsync: (tracks: Omit<Track, "index" | "roomId">[]) =>
      mutateAsync({ roomId, tracks }),
    ...rest,
  };
};
