import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { useInvalidateFissa } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import { Fab, FissaTracks, PinCode, SafeAreaView } from "../../../src/components";
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
    <SafeAreaView style={{ backgroundColor: theme["900"] }} noBottom>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full w-full">
        <QuickVoteProvider>
          <FissaTracks pin={String(pin)} />
        </QuickVoteProvider>
        <PinCode />
        <Fab title="add songs" icon="plus" linkTo={`fissa/${pin}/addTracks`} />
      </View>
    </SafeAreaView>
  );
};

export default Fissa;
