import { SafeAreaView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Fab, ListHeaderComponent, RoomTracks } from "../../../src/components";

const Room = () => {
  const { pin } = useSearchParams();

  return (
    <View className="pt-12" style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full w-full">
        <RoomTracks />
        <Fab title="add tracks" icon="add" linkTo={`room/${pin}/addTracks`} />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
      </View>
    </View>
  );
};

export default Room;
