import { useEffect } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { useInvalidateFissa } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import { Fab, FissaTracks, PinCode } from "../../../src/components";
import { QuickVoteProvider } from "../../../src/components/pages/fissa";
import { useOnActiveApp } from "../../../src/hooks";
import { Test } from "./Test";

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
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Fissa ${pin}`,
          headerRight: () => <PinCode />,
        }}
      />
      <View className="h-full w-full">
        <QuickVoteProvider>
          <FissaTracks pin={String(pin)} />
        </QuickVoteProvider>
        <PinCode />
        <View className="absolute bottom-96 h-40 w-40">
          <Test />
        </View>

        <Fab
          position="bottom-center"
          title="add songs"
          icon="plus"
          linkTo={`fissa/${pin}/addTracks`}
        />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
      </View>
    </View>
  );
};

export default Fissa;
