import { useEffect } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Fab, PinCode, RoomTracks } from "../../../src/components";

const Room = () => {
  const { back } = useRouter();
  const { pin } = useSearchParams();

  useEffect(() => {
    if (pin) return;
    back();
  }, [pin, back]);

  if (!pin) return null;

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerRight: () => <PinCode />,
          title: "Now playing",
        }}
      />
      <View className="flex h-full w-full">
        <RoomTracks pin={pin} />
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
