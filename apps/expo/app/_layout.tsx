import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { isRunningInExpoGo } from "expo";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";
import "../src/utils/nativewind-interop";

import { Header, ToastContainer } from "../src/components/";
import { NotificationProvider, SpotifyProvider } from "../src/providers";
import { TRPCProvider } from "../src/utils/api";

function RootLayout() {
  return (
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
}

const SentryWrapped = Sentry.wrap(RootLayout);
export default SentryWrapped;

function Updater() {
  useEffect(() => {
    if (isRunningInExpoGo()) return;

    async function updateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (!update.isAvailable) return;

        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch (error) {
        console.error("Error fetching latest Expo update", error);
      }
    }

    void updateAsync();
  }, []);

  return null;
}
