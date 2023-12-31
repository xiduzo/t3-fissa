import { useCallback, type FC } from "react";
import { Share, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useGlobalSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Fab, FissaTracks, Settings, Typography } from "../../../src/components";
import { QuickVoteProvider, SpeakerButton } from "../../../src/components/pages/fissa";

const Fissa = () => {
  const { pin } = useGlobalSearchParams();

  if (!pin) return null;

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft: () => <Title pin={String(pin)} />,
          // title: () => <Title pin={String(pin)} />,
          headerRight,
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
  const handlePinPress = useCallback(async () => {
    const isShared = await Share.share(
      {
        title: "Join the Fissa!",
        message: `You have been invited to join the Fissa! https://fissa-houseparty.vercel.app/fissa/${pin}`,
        url: `https://fissa-houseparty.vercel.app/fissa/${pin}`,
      },
      {
        dialogTitle: "Join the Fissa!",
        subject: `You have been invited to join the Fissa! https://fissa-houseparty.vercel.app/fissa/${pin}`,
        tintColor: theme["500"],
      },
    );

    console.log(isShared);
  }, [pin]);

  return (
    <View className="grow">
      <TouchableOpacity onPress={handlePinPress}>
        <Typography variant="h2">Fissa {pin}</Typography>
      </TouchableOpacity>
    </View>
  );
};
