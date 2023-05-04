import { FC, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "expo-router";
import { useSpotify } from "@fissa/utils";

import { useGetFissa, useRestartFissa } from "../../../hooks";
import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Button, EmptyState, SelectDevice } from "../../shared";

export const ListEmptyComponent: FC<Props> = ({ isLoading }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const spotify = useSpotify();

  const [hasActiveDevice, setHasActiveDevice] = useState(false);

  const { data: fissa } = useGetFissa(String(pin));
  const { mutateAsync } = useRestartFissa(String(pin), {
    onMutate: () => {
      toast.info({
        message: "Restarting fissa",
      });
    },
    onSuccess: () => {
      toast.success({
        icon: "🎉",
        message: "Let's go!",
      });
    },
  });

  const checkIfUserHasActiveDevice = useCallback(async () => {
    const { device } = await spotify.getMyCurrentPlaybackState();
    setHasActiveDevice(!!device?.is_active);
  }, [spotify]);

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      try {
        await spotify.transferMyPlayback([device.id!]);
        await mutateAsync();
      } catch (e) {
        checkIfUserHasActiveDevice();
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      }
    },
    [spotify, checkIfUserHasActiveDevice, mutateAsync],
  );

  useEffect(() => {
    checkIfUserHasActiveDevice();
  }, [checkIfUserHasActiveDevice]);

  if (isLoading)
    return <EmptyState icon="🐕" title="Fetching songs" subtitle="Good boy" />;

  if (!fissa?.currentlyPlayingId) {
    const isOwner = user?.email === fissa?.by.email;

    if (isOwner && !hasActiveDevice) {
      return (
        <EmptyState
          icon="🎧"
          title="No active device"
          subtitle="Select the device for blasting your tunes"
        >
          <SelectDevice onSelectDevice={handleDeviceSelect} />
        </EmptyState>
      );
    }

    return (
      <EmptyState
        icon="🦥"
        title="This fissa is asleep"
        subtitle={!isOwner && "Poke your host to continue"}
      >
        {isOwner && <Button onPress={mutateAsync} title="Continue fissa" />}
      </EmptyState>
    );
  }

  return (
    <EmptyState
      icon="🦀"
      title="No songs found"
      subtitle="Add songs to get the fissa started"
    />
  );
};

interface Props {
  isLoading: boolean;
}
