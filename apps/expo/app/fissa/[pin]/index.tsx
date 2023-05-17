import { useEffect } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { useInvalidateFissa } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import {
  Fab,
  FissaTracks,
  IconButton,
  PinCode,
  SafeAreaView,
  Typography,
} from "../../../src/components";
import { QuickVoteProvider } from "../../../src/components/pages/fissa";
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
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Fissa ${pin}`,
          headerRight: () => <PinCode />,
        }}
      />
      <View className="flex h-full w-full">
        {/* <LinearGradient
          colors={[theme[900], "transparent"]}
          className="absolute top-0 z-10 h-24 w-full"
        /> */}
        <QuickVoteProvider>
          <FissaTracks pin={String(pin)} />
        </QuickVoteProvider>
        <PinCode />
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
