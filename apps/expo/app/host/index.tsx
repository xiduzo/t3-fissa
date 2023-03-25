import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Button, Typography } from "../../src/components";

const Host = () => {
  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View className="flex h-full justify-between px-6">
        <View />
        <View>
          <Typography variant="h1" centered className="mb-4">
            Host a fissa
          </Typography>
          <Typography centered>How would you like to start</Typography>
        </View>
        <View>
          <Button
            title="Based on my playlist"
            className="mb-6"
            linkTo="/host/fromPlaylist"
          />
          <Button title="Pick 5 tracks" variant="outlined" />
        </View>
        <View />
      </View>
    </SafeAreaView>
  );
};

export default Host;
