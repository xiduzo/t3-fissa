import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import 'react-native-reanimated'; // https://github.com/expo/expo/issues/28618
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Header, ToastContainer } from "../src/components/";
import { NotificationProvider, SpotifyProvider } from "../src/providers";
import { TRPCProvider } from "../src/utils/api";

const RootLayout = () => (
  <TRPCProvider>
    <NotificationProvider>
      <Updater />
      <SpotifyProvider>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              header: (props) => <Header {...props} />,
            }}
          />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </SpotifyProvider>
      <ToastContainer />
    </NotificationProvider>
  </TRPCProvider>
);

export default Sentry.wrap(RootLayout);

const Updater = () => {

  useEffect(() => {
    async function updateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if(!update.isAvailable) return

        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync(); // TODO: let the user know that an update is available and ask them to reload?
      } catch (error) {
        console.error("Error fetching latest Expo update", error);
      }
    }

    void updateAsync();
  }, [])

  return null;
};
