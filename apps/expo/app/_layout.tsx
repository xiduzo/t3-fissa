import React, { useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import * as Sentry from "@sentry/react-native";

import { Header, ToastContainer } from "../src/components/";
import { NotificationProvider, SpotifyProvider } from "../src/providers";
import { toast } from "../src/utils";
import { TRPCProvider } from "../src/utils/api";

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

export default Sentry.wrap(RootLayout);

const Updater = () => {
  const handleUpdate = useCallback(({ type }: Updates.UpdateEvent) => {
    if (type === Updates.UpdateEventType.ERROR) {
      // Handle error
    } else if (type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      // Handle no update available
    } else if (type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      // Handle update available
      toast.info({ message: "Installing update" });
      void Updates.fetchUpdateAsync().then(Updates.reloadAsync);
    }
  }, []);

  Updates.useUpdateEvents(handleUpdate);

  return null;
};
