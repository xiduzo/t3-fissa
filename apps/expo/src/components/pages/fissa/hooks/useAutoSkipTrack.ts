import { useMemo } from "react";
import { RefetchInterval, useSpotify } from "@fissa/utils";

import { useGetFissaDetails, useSkipTrack } from "../../../../hooks";
import { useAuth } from "../../../../providers";

export const useAutoSkipTrack = (pin: string) => {
  const { user } = useAuth();
  const { data } = useGetFissaDetails(String(pin), RefetchInterval.Fast);
  const spotify = useSpotify();

  const { mutateAsync } = useSkipTrack(pin);

  useMemo(async () => {
    if (!user) return;
    if (!data?.currentlyPlayingId) return;

    if (data.by.email !== user.email) return;

    // Give the BE some time to start playing the track
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const { is_playing } = await spotify.getMyCurrentPlaybackState();
    if (is_playing) return;

    // Skip tracks when fissa says we are playing a track
    // While spotify says we are not playing a track
    await mutateAsync();
  }, [user, data?.currentlyPlayingId, spotify, mutateAsync]);
};
