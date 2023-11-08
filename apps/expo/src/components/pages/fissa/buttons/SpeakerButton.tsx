import { useCallback, useState } from "react";
import { Slider, View } from "react-native";
import { useSearchParams } from "expo-router";
import { useIsOwner } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import { useDevices, useSpotify } from "@fissa/utils";

import { mapDeviceToIcon, toast } from "../../../../utils";
import { IconButton, Popover, SelectDevice } from "../../../shared";

export const SpeakerButton = () => {
  const spotify = useSpotify();
  const { pin } = useSearchParams();
  const isOwner = useIsOwner(String(pin));

  const { activeDevice, fetchDevices } = useDevices();
  const [selectDevice, setSelectDevice] = useState(false);

  const toggleSelectDevice = useCallback(() => {
    setSelectDevice((prev) => !prev);
  }, []);

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      if (!device.id) return;
      try {
        await spotify.transferMyPlayback([device.id]);
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
        fetchDevices();
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
