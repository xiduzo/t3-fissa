import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCreateFissa as useBaseCreateFissa } from "@fissa/hooks";

import { mapSpotifyTrackToTrpcTrack, toast } from "../utils";
import {
  ENCRYPTED_STORAGE_KEYS,
  useEncryptedStorage,
} from "./useEncryptedStorage";

type Tracks = (SpotifyApi.TrackObjectFull | SpotifyApi.TrackObjectSimplified)[];

export const useCreateFissa = () => {
  const { push } = useRouter();

  const { save } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastPin);

  const { mutate, mutateAsync, ...rest } = useBaseCreateFissa({
    onSuccess: async ({ pin }) => {
      toast.success({ message: "Enjoy your fissa", icon: "🎉" });
      await save(pin);
      push(`/fissa/${pin}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      toast.error({ message: error.message });
    },
  });

  return {
    ...rest,
    mutate: (tracks: Tracks) => mutate(tracks.map(mapSpotifyTrackToTrpcTrack)),
    mutateAsync: (tracks: Tracks) =>
      mutateAsync(tracks.map(mapSpotifyTrackToTrpcTrack)),
  };
};
