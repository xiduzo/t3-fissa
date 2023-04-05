import React, { FC } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { useTracks } from "@fissa/utils";

import { Button, Typography } from "../src/components";
import {
  ENCRYPTED_STORAGE_KEYS,
  useEncryptedStorage,
  useGetRoomDetails,
  useGetTracks,
} from "../src/hooks";
import { useAuth } from "../src/providers";

const Home = () => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full justify-between px-6">
        <View />
        <View>
          <Typography variant="h1" centered className="mb-4">
            Hi there {user!.display_name},
          </Typography>
          <Typography centered>what are you up to</Typography>
        </View>
        <View>
          <Button title="join a fissa" className="mb-6" linkTo="/join" />
          <Button title="host a fissa" variant="outlined" linkTo="/host" />
        </View>
        <Rejoin />
      </View>
    </SafeAreaView>
  );
};

export default Home;

const Rejoin = () => {
  const { value } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastPin);
  const { data } = useGetRoomDetails(value!);

  if (!value) return <View />; // no pin stored
  if (!data) return <View />; // no room found

  return (
    <View>
      <PrefetchTracks pin={value} />
      <Button
        variant="text"
        title={`re-join ${value}`}
        linkTo={`/room/${value}`}
      />
    </View>
  );
};

const PrefetchTracks: FC<{ pin: string }> = ({ pin }) => {
  const { data } = useGetTracks(pin);

  // Pre-fetch tracks
  useTracks(data?.map((track) => track.trackId));

  return null;
};
