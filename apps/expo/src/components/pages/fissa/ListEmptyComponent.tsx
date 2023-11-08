import { useCallback, type FC } from "react";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useSearchParams } from "expo-router";
import { useIsOwner, useRestartFissa } from "@fissa/hooks";
import { useDevices, useSpotify } from "@fissa/utils";

import { toast } from "../../../utils";
import { Button, EmptyState, SelectDevice } from "../../shared";

export const ListEmptyComponent: FC<Props> = ({ isLoading }) => {
  const { pin } = useSearchParams();
  const isOwner = useIsOwner(String(pin));

  const spotify = useSpotify();
  const { activeDevice, fetchDevices } = useDevices();

  const { mutateAsync } = useRestartFissa(String(pin), {
    onMutate: async () => {
      await notificationAsync(NotificationFeedbackType.Warning);
    },
    onSuccess: () => {
      toast.success({
        icon: "🎉",
        message: "Let's go!",
      });
    },
  });

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      if (!device.id) return;
      try {
        await spotify.transferMyPlayback([device.id]);
        await mutateAsync();
      } catch (e) {
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      } finally {
        fetchDevices().catch(console.log);
      }
    },
    [spotify, fetchDevices, mutateAsync],
  );

  if (isLoading) return <EmptyState icon="🐕" title="Fetching songs" subtitle="Good boy" />;

  if (isOwner && !activeDevice) {
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
};

interface Props {
  isLoading: boolean;
}
