import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useRouter } from "expo-router";
import { useCreateFissa as useBaseCreateFissa } from "@fissa/hooks";

import { mapSpotifyTrackToTrpcTrack, toast } from "../utils";

type Tracks = (SpotifyApi.TrackObjectFull | SpotifyApi.TrackObjectSimplified)[];

export const useCreateFissa = () => {
  const { push } = useRouter();

  const { mutate, mutateAsync, ...rest } = useBaseCreateFissa({
    onSuccess: async ({ pin }) => {
      toast.success({ message: "Enjoy your fissa", icon: "🎉" });
      push(`/fissa/${pin}`);
      await notificationAsync(NotificationFeedbackType.Success);
    },
    onError: (error) => {
      toast.error({ message: error.message });
    },
  });

  return {
    ...rest,
    mutate: (tracks: Tracks) => mutate(tracks.map(mapSpotifyTrackToTrpcTrack)),
    mutateAsync: (tracks: Tracks) => mutateAsync(tracks.map(mapSpotifyTrackToTrpcTrack)),
  };
};
