import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  SafeAreaView,
  TouchableHighlight,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { useSpotify } from "@fissa/utils";

import { Button, Popover, Typography } from "../../src/components";
import { toast } from "../../src/utils";

const Host = () => {
  const spotify = useSpotify();
  const { push } = useRouter();
  const [devices, setDevices] = useState<SpotifyApi.UserDevice[]>([]);

  const [showHelp, setShowHelp] = useState(false);

  const fetchMyDevices = useCallback(async () => {
    try {
      const { devices } = await spotify.getMyDevices();
      setDevices(devices);
    } catch {
      // Ignore
    }
  }, [spotify]);

  const toggleHelp = useCallback(async () => {
    setShowHelp((prev) => !prev);
    fetchMyDevices();
  }, [fetchMyDevices]);

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      try {
        await spotify.transferMyPlayback([device.id!]);
        toast.success({
          icon: "🐋",
          message: `Connected to ${device.name}`,
        });

        push("/host");
      } catch {
        fetchMyDevices();
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      }
    },
    [spotify, push, fetchMyDevices],
  );

  const openSpotify = useCallback(async () => {
    await Linking.openURL("spotify://");
    toggleHelp();
  }, [toggleHelp]);

  useEffect(() => {
    const { remove } = AppState.addEventListener("change", () => {
      if (AppState.currentState !== "active") return;
      fetchMyDevices();
    });

    fetchMyDevices();

    return remove;
  }, [fetchMyDevices]);

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
        <View className="space-y-2">
          {devices.map((device) => (
            <Button
              key={device.id}
              icon={mapDeviceToIcon(device)}
              variant="text"
              title={device.name}
              onPress={handleDeviceSelect(device)}
            />
          ))}
        </View>
        <Button
          icon="question"
          variant="text"
          title="I can't find my device"
          onPress={toggleHelp}
        />
      </View>
      <Popover visible={showHelp} onRequestClose={toggleHelp}>
        <Typography centered variant="h2" inverted>
          Follow the steps below
        </Typography>
        <View className="mx-4 my-6 space-y-3">
          <View className="flex-row space-x-2">
            <View className="overflow-hidden rounded-full">
              <Typography
                className="px-1.5"
                style={{ backgroundColor: theme["900"] }}
              >
                1
              </Typography>
            </View>
            <Typography inverted>
              <Typography inverted className="mr-1 font-bold">
                Open spotify
              </Typography>{" "}
              via the button below
            </Typography>
          </View>
          <View className="flex-row space-x-2">
            <View className="overflow-hidden rounded-full">
              <Typography
                className="px-1.5"
                style={{ backgroundColor: theme["900"] }}
              >
                2
              </Typography>
            </View>
            <Typography inverted>
              <Typography inverted className="mr-1 font-bold">
                Select your device
              </Typography>{" "}
              via the Spotify player
            </Typography>
          </View>
          <View className="flex-row space-x-2">
            <View className="overflow-hidden rounded-full">
              <Typography
                className="px-1.5"
                style={{ backgroundColor: theme["900"] }}
              >
                3
              </Typography>
            </View>
            <Typography inverted>
              <Typography inverted className="mr-1 font-bold">
                Come back
              </Typography>{" "}
              to the fissa app
            </Typography>
          </View>
        </View>
        <Button inverted title="Open spotify" onPress={openSpotify} />
      </Popover>
    </SafeAreaView>
  );
};

export default Host;

const mapDeviceToIcon = (
  device: SpotifyApi.UserDevice,
): keyof typeof FontAwesome.glyphMap => {
  switch (device.type.toLowerCase()) {
    case "computer":
      return "laptop";
    case "smartphone":
      return "mobile";
    case "castvideo":
    case "speaker":
      return "bluetooth-b";
    default:
      return "question";
  }
};
