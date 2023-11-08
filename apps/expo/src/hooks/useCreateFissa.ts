import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useRouter } from "expo-router";
import { useCreateFissa as useBaseCreateFissa } from "@fissa/hooks";

import { mapSpotifyTrackToTrpcTrack, toast } from "../utils";

type Tracks = (SpotifyApi.TrackObjectFull | SpotifyApi.TrackObjectSimplified)[];

type Options = Parameters<typeof useBaseCreateFissa>[0];

export const useCreateFissa = (options?: Options) => {
  const { push } = useRouter();

  const { mutate, mutateAsync, ...rest } = useBaseCreateFissa({
    ...options,
    onSuccess: async (...props) => {
      const [data] = props;
      toast.success({ message: "Enjoy your fissa", icon: "🎉" });
      push(`/fissa/${data.pin}`);
      await notificationAsync(NotificationFeedbackType.Success);
      await options?.onSuccess?.(...props);
    },
    onError: (...props) => {
      const [data] = props;
      toast.error({ message: data.message });
      options?.onError?.(...props);
    },
  });

  return {
    ...rest,
    mutate: (tracks: Tracks) => mutate(tracks.map(mapSpotifyTrackToTrpcTrack)),
    mutateAsync: (tracks: Tracks) => mutateAsync(tracks.map(mapSpotifyTrackToTrpcTrack)),
  };
};
