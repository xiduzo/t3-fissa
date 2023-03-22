import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { Header, ToastContainer } from "../src/components/";
import { NotificationProvider, SpotifyProvider } from "../src/providers";
import { TRPCProvider } from "../src/utils/api";

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  return (
    <TRPCProvider>
      <NotificationProvider>
        <SpotifyProvider>
          <SafeAreaProvider>
            <Stack
              screenOptions={{
                header: (props) => <Header {...props} />,
              }}
            />
            <StatusBar />
            <ToastContainer />
          </SafeAreaProvider>
        </SpotifyProvider>
      </NotificationProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
