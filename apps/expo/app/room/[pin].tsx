import { useState } from "react";
import { SafeAreaView, View, VirtualizedList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import Action from "../../src/components/Action";
import { Button } from "../../src/components/Button";
import Popover from "../../src/components/Popover";
import { Typography } from "../../src/components/Typography";

const Room = () => {
  const { pin } = useSearchParams();

  const [test, setTest] = useState(false);
  console.log(pin);
  return (
    <SafeAreaView className="bg-theme-900">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mt-6 flex h-full w-full">
        <View className="flex-row items-center justify-between px-6">
          <Typography variant="h2">Now Playing</Typography>
          <Button
            onPress={() => setTest(true)}
            className="opacity-60"
            title={pin!}
            variant="text"
            endIcon="information-circle-outline"
          />
        </View>
        <VirtualizedList
          className="px-6"
          data={[
            {
              id: 1,
              name: "test",
            },
          ]}
          getItemCount={() => 25}
          getItem={(data, index) => data[index]}
          renderItem={(render) => <Typography>{render.index}</Typography>}
          keyExtractor={(item, index) => index}
          initialNumToRender={5}
          ListFooterComponent={ListFooterComponent}
        />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
        <Popover visible={test} onRequestClose={() => setTest(false)}>
          <Action
            title="title"
            subtitle="subtitle"
            icon="funnel"
            layout="column"
          />
          <Action
            title="title"
            reversed
            subtitle="subtitle"
            icon="funnel"
            layout="column"
          />
          <Action title="title" subtitle="subtitle" icon="funnel" />
          <Action disabled title="title" subtitle="subtitle" icon="bulb" />
          <Action
            disabled
            active
            title="title"
            subtitle="subtitle"
            icon="film"
          />
        </Popover>
      </View>
    </SafeAreaView>
  );
};

export default Room;

const ListFooterComponent = () => {
  return (
    <View className="mb-36 flex items-center justify-center py-24">
      <Typography variant="h1" className="mb-4">
        🦦
      </Typography>
      <Typography variant="bodyM">Add tracks or I'll fill the queue</Typography>
    </View>
  );
};
