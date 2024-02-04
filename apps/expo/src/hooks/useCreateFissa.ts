import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { useRouter } from "expo-router";

import { api, mapSpotifyTrackToTrpcTrack, toast } from "../utils";

type Tracks = (SpotifyApi.TrackObjectFull | SpotifyApi.TrackObjectSimplified)[];

export const useCreateFissa = (options?: Parameters<typeof api.fissa.create.useMutation>[0]) => {
  const { push } = useRouter();

  const { mutate, mutateAsync, ...rest } = api.fissa.create.useMutation({
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
