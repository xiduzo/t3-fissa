import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import ToastContainer from "../src/components/Toast";
import { SpotifyProvider } from "../src/providers/AuthProvider";
import { NotificationProvider } from "../src/providers/NotificationProvider";
import { TRPCProvider } from "../src/utils/api";

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  return (
    <TRPCProvider>
      <NotificationProvider>
        <SpotifyProvider>
          <SafeAreaProvider>
            <Stack />
            <StatusBar />
            <ToastContainer />
          </SafeAreaProvider>
        </SpotifyProvider>
      </NotificationProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
