import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { useInvalidateFissa } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import { Fab, FissaTracks, PinCode } from "../../../src/components";
import { useOnActiveApp } from "../../../src/hooks";

const Fissa = () => {
  const { back } = useRouter();
  const { pin } = useSearchParams();

  const invalidate = useInvalidateFissa();

  useOnActiveApp(() => invalidate(String(pin)));

  useEffect(() => {
    if (pin) return;
    back();
  }, [pin, back]);

  if (!pin) return null;

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full w-full">
        <LinearGradient
          colors={[theme[900], "transparent"]}
          className="absolute top-0 z-10 h-24 w-full"
        />
        <FissaTracks pin={String(pin)} />
        <PinCode />
        <Fab title="add songs" icon="plus" linkTo={`fissa/${pin}/addTracks`} />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
      </View>
    </View>
  );
};

export default Fissa;
