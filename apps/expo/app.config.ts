import { ConfigContext, ExpoConfig } from "@expo/config";

const defineConfig = (_ctx: ConfigContext): ExpoConfig => ({
  name: "fissa",
  slug: "fissa",
  scheme: "com.fissa",
  version: "3.0.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#171717",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "org.reactjs.native.example.fissa",
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#171717",
    },
  },
  extra: {
    eas: {
      projectId: "89f5d2ef-e72d-4e2c-a88c-3fe56e30e601",
    },
  },
  plugins: ["./expo-plugins/with-modify-gradle.js"],
});

export default defineConfig;
