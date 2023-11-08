import React, { useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";

import { Header, ToastContainer } from "../src/components/";
import { NotificationProvider, SpotifyProvider } from "../src/providers";
import { toast } from "../src/utils";
import { TRPCProvider } from "../src/utils/api";

import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://b107ae36171541b58896d22738c2a6bc@o4504055699996672.ingest.sentry.io/4504055702880256",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// This is the main layout of the app
// It wraps your pages with the providers they need
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

export default RootLayout;

const Updater = () => {
  const handleUpdate = useCallback(({ type }: Updates.UpdateEvent) => {
    if (type === Updates.UpdateEventType.ERROR) {
      // Handle error
    } else if (type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      // Handle no update available
    } else if (type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      // Handle update available
      toast.info({ message: "Installing update" });
      Updates.fetchUpdateAsync().then(Updates.reloadAsync).catch(console.log);
    }
  }, []);

  Updates.useUpdateEvents(handleUpdate);

  return null;
};
