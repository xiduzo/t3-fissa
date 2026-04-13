import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentryDsn ?? "",
  debug: false,
  enabled: !__DEV__,
});

import "../global.css";
import "../src/utils/nativewind-interop";

import { Header, ToastContainer } from "../src/components/";
import { NotificationProvider, SpotifyProvider, ThemeProvider, useTheme } from "../src/providers";
import { TRPCProvider } from "../src/utils/api";

function ThemedStack() {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          header: (props) => <Header {...props} />,
          contentStyle: { backgroundColor: theme["900"] },
        }}
      />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

function RootLayout() {
  return (
    <TRPCProvider>
      <NotificationProvider>
        <Updater />
        <SpotifyProvider>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
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
