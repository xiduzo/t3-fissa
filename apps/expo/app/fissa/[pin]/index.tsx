import { useEffect } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import {
  Fab,
  FissaTracks,
  PinCode,
  useAutoSkipTrack,
} from "../../../src/components";
import { useInvalidateFissa, useOnActiveApp } from "../../../src/hooks";

const Fissa = () => {
  const { back } = useRouter();
  const { pin } = useSearchParams();

  const invalidate = useInvalidateFissa();

  useAutoSkipTrack(String(pin));
  useOnActiveApp(invalidate);

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
        <FissaTracks pin={pin} />
        <Fab title="add tracks" icon="plus" linkTo={`fissa/${pin}/addTracks`} />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
      </View>
    </View>
  );
};

export default Fissa;
