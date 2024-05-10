import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import 'react-native-reanimated'; // https://github.com/expo/expo/issues/28618
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Header, ToastContainer } from "../src/components/";
import { NotificationProvider, SpotifyProvider } from "../src/providers";
import { toast } from "../src/utils";
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
    Updates.checkForUpdateAsync().then(async update => {
      if (update.isAvailable) {
        toast.info({
          message: "A new update is available. Downloading...",
        });
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
      }
    }).catch((error) => {
      console.error("Error fetching latest Expo update", error);
    });
  })

  return null;
};
