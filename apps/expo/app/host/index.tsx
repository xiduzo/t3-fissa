import { useCallback } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { useSpotify } from "@fissa/utils";

import { Button, Typography } from "../../src/components";
import { useCreateRoom } from "../../src/components/pages/room/hooks/useCreateRoom";
import { toast } from "../../src/utils";

const Host = () => {
  const spotify = useSpotify();

  const { mutateAsync, isLoading } = useCreateRoom();

  const handleSurpriseMe = useCallback(async () => {
    toast.info({ message: "Starting a surprise fissa" });

    const { items } = await spotify.getMyTopTracks({ limit: 5 });

    const tracks = items.map((track) => ({
      durationMs: track.duration_ms,
      trackId: track.id,
    }));

    await mutateAsync(tracks);
  }, [spotify]);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View className="flex h-full justify-between px-6">
        <View className="-mt-10" />
        <View>
          <Typography variant="h1" centered className="mb-4">
            Host a fissa
          </Typography>
          <Typography centered>how would you like to start</Typography>
        </View>
        <View>
          <Button
            title="Based on my playlist"
            className="mb-6"
            linkTo="/host/fromPlaylist"
          />
          <Button
            title="Select some tracks"
            variant="outlined"
            linkTo="/host/fromTracks"
          />
        </View>
        <View>
          <Button
            title="Surprise me"
            variant="text"
            onPress={handleSurpriseMe}
            disabled={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Host;
