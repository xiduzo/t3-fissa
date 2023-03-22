import { SafeAreaView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Fab, PinCode, RoomTracks, Typography } from "../../../src/components";

const Room = () => {
  const { pin } = useSearchParams();

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mt-6 flex h-full w-full">
        <View className="flex-row items-center justify-between px-6">
          <Typography variant="h2">Now Playing</Typography>
          <PinCode />
        </View>
        <RoomTracks />
        <Fab title="add tracks" icon="add" linkTo={`room/${pin}/addTracks`} />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
      </View>
    </SafeAreaView>
  );
};

export default Room;
