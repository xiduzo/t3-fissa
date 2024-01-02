import { type FC } from "react";
import { TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useGlobalSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Fab, FissaTracks, PageTemplate, Settings, Typography } from "../../../src/components";
import { QuickVoteProvider, SpeakerButton } from "../../../src/components/pages/fissa";
import { useShareFissa } from "../../../src/hooks/useShareFissa";

const Fissa = () => {
  const { pin } = useGlobalSearchParams();

  if (!pin) return null;

  return (
    <PageTemplate fullScreen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft: () => <Title pin={String(pin)} />,
          headerRight,
        }}
      />
      <QuickVoteProvider>
        <FissaTracks pin={String(pin)} />
      </QuickVoteProvider>
      <Fab title="add songs" icon="plus" linkTo={`fissa/${pin}/addTracks`} />
      <LinearGradient
        colors={["transparent", theme[900]]}
        className="absolute bottom-0 h-24 w-full"
      />
    </PageTemplate>
  );
};

export default Fissa;

const headerRight = () => <HeaderRight />;

const HeaderRight = () => {
  return (
    <View className="flex-row">
      <SpeakerButton />
      <View className="mx-3" />
      <Settings />
    </View>
  );
};

const Title: FC<{ pin: string }> = ({ pin }) => {
  const { shareFissa } = useShareFissa(pin);

  return (
    <View className="grow">
      <TouchableOpacity onPress={shareFissa}>
        <Typography variant="h2">Fissa {pin}</Typography>
      </TouchableOpacity>
    </View>
  );
};
