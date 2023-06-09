import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useSearchParams } from "expo-router";
import { useInvalidateFissa } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import { FissaTracks, PinCode } from "../../../src/components";
import { FissaFab, HostMenu, QuickVoteProvider } from "../../../src/components/pages/fissa";
import { useOnActiveApp } from "../../../src/hooks";

const Fissa = () => {
  const { pin } = useSearchParams();

  const invalidate = useInvalidateFissa();

  useOnActiveApp(() => invalidate(String(pin)));

  if (!pin) return null;

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Fissa ${pin}`,
          headerRight: HeaderRight,
        }}
      />
      <View className="h-full w-full">
        <QuickVoteProvider>
          <FissaTracks pin={String(pin)} />
        </QuickVoteProvider>
        <FissaFab pin={String(pin)} />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
        <HostMenu />
      </View>
    </View>
  );
};

export default Fissa;

const HeaderRight = () => <PinCode />;
