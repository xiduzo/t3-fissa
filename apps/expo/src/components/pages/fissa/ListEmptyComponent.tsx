import { useCallback, type FC } from "react";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { useGlobalSearchParams } from "expo-router";
import { useDevices, useSpotify } from "@fissa/utils";

import { useIsOwner } from "../../../hooks";
import { api, toast } from "../../../utils";
import { Button, EmptyState, SelectDevice } from "../../shared";

export const ListEmptyComponent: FC<Props> = ({ isLoading }) => {
  const { pin } = useGlobalSearchParams();
  const isOwner = useIsOwner(String(pin));

  const spotify = useSpotify();
  const { activeDevice, fetchDevices } = useDevices();
  const queryClient = api.useContext();

  const { mutateAsync } = api.fissa.restart.useMutation({
    onMutate: async () => {
      await notificationAsync(NotificationFeedbackType.Warning);
    },
    onSuccess: async () => {
      await queryClient.fissa.invalidate();
      toast.success({
        icon: "🎉",
        message: "Let's go!",
      });
    },
  });

  const handleRestartFissa = useCallback(async () => {
    await mutateAsync(String(pin));
  }, [mutateAsync, pin]);

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      if (!device.id) return;
      try {
        await spotify.transferMyPlayback([device.id]);
        await handleRestartFissa();
      } catch (e) {
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      } finally {
        fetchDevices();
      }
    },
    [spotify, fetchDevices, handleRestartFissa],
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
      {isOwner && <Button onPress={handleRestartFissa} title="Continue fissa" />}
    </EmptyState>
  );
};

interface Props {
  isLoading: boolean;
}
