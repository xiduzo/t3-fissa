import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { useSpotify } from "@fissa/utils";

import { Button, Typography } from "../../src/components";
import { useCreateRoom } from "../../src/components/pages/room/hooks/useCreateRoom";
import { toast } from "../../src/utils";

const Host = () => {
  const spotify = useSpotify();
  const [devices, setDevices] = useState<SpotifyApi.UserDevice[]>([]);

  const handleDeviceSelect = useCallback(async () => {}, []);

  useEffect(() => {
    spotify.getMyDevices().then(({ devices }) => {
      setDevices(devices);
    });
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View className="flex h-full justify-between px-6">
        <View className="-mt-10" />
        <View></View>
        <View>
          <Button
            icon="spotify"
            variant="text"
            title="select a device via spotify"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Host;
