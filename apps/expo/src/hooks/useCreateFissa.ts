import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCreateFissa as useBaseCreateFissa } from "@fissa/hooks";

import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from ".";
import { toast } from "../utils";

export const useCreateFissa = () => {
  const { push } = useRouter();

  const { save } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastPin);

  const { mutate, mutateAsync, ...rest } = useBaseCreateFissa({
    onMutate: () => {
      toast.info({
        message: `Starting your fissa`,
      });
    },
    onSuccess: async ({ pin }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success({ message: "Enjoy your fissa", icon: "🎉" });
      await save(pin);
      push(`/fissa/${pin}`);
    },
    onError: (error) => {
      toast.error({ message: error.message });
    },
  });

  return {
    ...rest,
    mutate: (tracks: SpotifyApi.TrackObjectFull[]) =>
      mutate(tracks.map(mapSpotifyTrackToTrpcTrack)),
    mutateAsync: (tracks: SpotifyApi.TrackObjectFull[]) =>
      mutateAsync(tracks.map(mapSpotifyTrackToTrpcTrack)),
  };
};

const mapSpotifyTrackToTrpcTrack = (track: SpotifyApi.TrackObjectFull) => ({
  durationMs: track.duration_ms,
  trackId: track.id,
});
