import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Button, Typography } from "../src/components";
import { useEncryptedStorage } from "../src/hooks";
import { useAuth } from "../src/providers";
import { api } from "../src/utils/api";

const Index = () => {
  const { promptAsync, user } = useAuth();

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full justify-between px-6">
        <View></View>
        <View>
          <Typography variant="h1" centered className="mb-4">
            Hi there{user?.display_name && " " + user.display_name},
          </Typography>
          <Typography centered>What are you up to?</Typography>
        </View>
        <View>
          <Button title="join a fissa" className="mb-6" linkTo="/join" />
          {!user && (
            <Button
              title="Sign in to host a fissa"
              onPress={() => promptAsync()}
              variant="text"
            />
          )}
          {user && <Button title="host a fissa" variant="outlined" />}
        </View>
        <View>
          <Rejoin />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Index;

const Rejoin = () => {
  const { value } = useEncryptedStorage("pin");
  const { data } = api.room.byId.useQuery(value!, {
    enabled: !!value,
  });

  if (!value) return null; // no pin stored
  if (!data) return null; // no room found

  return (
    <Button
      variant="text"
      title={`re-join ${value}`}
      linkTo={`/room/${value}`}
    />
  );
};
