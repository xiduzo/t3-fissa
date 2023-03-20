import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { Button } from "../src/components/Button";
import { Typography } from "../src/components/Typography";
import { useAuth } from "../src/providers/AuthProvider";

const Index = () => {
  const { promptAsync, user } = useAuth();

  return (
    <SafeAreaView className="bg-theme-900">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full w-full justify-between px-6">
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
          {user && (
            <Button title="host a fissa" className="mb-6" variant="outlined" />
          )}
        </View>
        <View>
          <Button variant="text" title="re join" disabled />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Index;
