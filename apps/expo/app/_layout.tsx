import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import 'react-native-reanimated'; // https://github.com/expo/expo/issues/28618
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Suppress Reanimated strict-mode warnings triggered by NativeWind's internal
// use of shared values during render — not an issue in our own code.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";
import "../src/utils/nativewind-interop";

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
