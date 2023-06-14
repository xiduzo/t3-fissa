import { useCallback, useState } from "react";
import { View } from "react-native";
import { useSearchParams } from "expo-router";
import Slider from "@react-native-community/slider";
import { useGetFissa, useSkipTrack } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import { useDevices, useSpotify } from "@fissa/utils";

import { useAuth } from "../../../providers";
import { mapDeviceToIcon, toast } from "../../../utils";
import { IconButton, Popover, SelectDevice, SpeedDialOption } from "../../shared";

export const HostMenu = () => {
  const { pin } = useSearchParams();

  const { user } = useAuth();
  const { data: fissa } = useGetFissa(String(pin));
  const { activeDevice } = useDevices();

  const isOwner = user?.email === fissa?.by.email;
  const isPlaying = fissa?.currentlyPlayingId;

  if (!isOwner) return null;
  if (!isPlaying) return null;
  if (!activeDevice) return null;

  return (
    <BottomDrawer size="partial">
      <View className="flex-row">
        <SpeakerButton />
        <PauseFissaButton />
        <SkipTrackButton />
      </View>
    </BottomDrawer>
  );
};

const PauseFissaButton = () => {
  const spotify = useSpotify();

  const pauseSpotify = useCallback(async () => {
    try {
      await spotify.pause();
    } catch (e) {
      toast.error({
        message: `Failed to pause fissa`,
      });
    }
  }, [spotify]);

  return (
    <IconButton inverted onPress={pauseSpotify} title="pause fissa" icon="pause" className="mx-5" />
  );
};

const SkipTrackButton = () => {
  const { pin } = useSearchParams();

  const { mutateAsync, isLoading } = useSkipTrack(String(pin), {
    onMutate: () => {
      toast.info({
        icon: "🐍",
        message: "Ssssssssskipping song",
        duration: 10000,
      });
    },
    onSettled: () => {
      toast.hide();
    },
  });

  return (
    <IconButton
      inverted
      onPress={mutateAsync}
      disabled={isLoading}
      title="play next song"
      icon="skip-forward"
    />
  );
};

const SpeakerButton = () => {
  const spotify = useSpotify();
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const { data: fissa } = useGetFissa(String(pin));

  const isOwner = user?.email === fissa?.by.email;

  const { activeDevice, fetchDevices } = useDevices();
  const [selectDevice, setSelectDevice] = useState(false);

  const toggleSelectDevice = useCallback(() => {
    setSelectDevice((prev) => !prev);
  }, []);

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      try {
        await spotify.transferMyPlayback([device.id!]);
        toast.success({
          icon: "🐋",
          message: `Connected to ${device.name}`,
        });

        toggleSelectDevice();
      } catch (e) {
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      } finally {
        await fetchDevices();
      }
    },
    [spotify, fetchDevices, toggleSelectDevice],
  );

  const handleVolumeChange = useCallback(
    async (volume: number) => {
      try {
        await spotify.setVolume(volume);
      } catch (e) {
        toast.error({
          message: `Failed to change volume`,
        });
      }
    },
    [spotify],
  );

  if (!isOwner) return null;

  return (
    <>
      <IconButton
        title="change device"
        icon={mapDeviceToIcon(activeDevice)}
        onPress={toggleSelectDevice}
      />
      <Popover visible={selectDevice} onRequestClose={toggleSelectDevice}>
        <SelectDevice onSelectDevice={handleDeviceSelect} inverted />
        {activeDevice && (
          <View className="space-y-6 py-4">
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              onValueChange={handleVolumeChange}
              value={activeDevice?.volume_percent ?? 0}
              thumbTintColor={theme["900"]}
              maximumTrackTintColor={theme["900"] + "30"}
              minimumTrackTintColor={theme["900"] + "90"}
            />
          </View>
        )}
      </Popover>
    </>
  );
};
