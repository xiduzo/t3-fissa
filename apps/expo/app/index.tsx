import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Button, Typography } from "../src/components";
import { useAuth } from "../src/providers";

const Index = () => {
  const { promptAsync, user } = useAuth();

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full justify-between px-6">
        <View />
        <View>
          <Typography variant="h1" centered className="mb-4">
            Hi there,
          </Typography>
        </View>
        <View>
          <Button
          icon="spotify"
            title="Sign to spotify"
            onPress={() => promptAsync()}
          />
        </View>
        <View className="mb-40" />
      </View>
    </SafeAreaView>
  );
};

export default Index;
