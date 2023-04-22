import { useCallback } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { useDevices, useSpotify } from "@fissa/utils";

import { SelectDevice, Typography } from "../../src/components";
import { toast } from "../../src/utils";

const Select = () => {
  const spotify = useSpotify();
  const { push } = useRouter();
  const { fetchDevices } = useDevices();

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      try {
        await spotify.transferMyPlayback([device.id!]);
        toast.success({
          icon: "🐋",
          message: `Connected to ${device.name}`,
        });

        push("/host");
      } catch (e) {
        fetchDevices();
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      }
    },
    [spotify, push, fetchDevices],
  );

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View className="flex h-full justify-around px-6">
        <View className="items-center">
          <Typography centered variant="h1" className="mb-4">
            Almost done!
          </Typography>
          <Typography centered variant="h5">
            Select the device for blasting your tunes
          </Typography>
        </View>
        <SelectDevice onSelectDevice={handleDeviceSelect} />
      </View>
    </SafeAreaView>
  );
};

export default Select;
