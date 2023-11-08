import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useGlobalSearchParams } from "expo-router";
import { useInvalidateFissa } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import { Fab, FissaTracks, Settings } from "../../../src/components";
import { QuickVoteProvider, SpeakerButton } from "../../../src/components/pages/fissa";
import { useOnActiveApp } from "../../../src/hooks";

const Fissa = () => {
  const { pin } = useGlobalSearchParams();

  const invalidate = useInvalidateFissa();

  useOnActiveApp(() => {
    invalidate(String(pin)).catch(console.log);
  });

  if (!pin) return null;

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Fissa ${pin}`,
          headerRight: () => <HeaderRight />,
        }}
      />
      <View className="h-full w-full">
        <QuickVoteProvider>
          <FissaTracks pin={String(pin)} />
        </QuickVoteProvider>
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

const HeaderRight = () => {
  return (
    <View className="flex-row">
      <SpeakerButton />
      <View className="mx-3" />
      <Settings />
    </View>
  );
};
