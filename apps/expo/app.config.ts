import { ConfigContext, ExpoConfig } from "@expo/config";

const defineConfig = (_ctx: ConfigContext): ExpoConfig => ({
  name: "fissa",
  slug: "fissa",
  scheme: "com.fissa",
  version: "3.0.12", // EAS VERSION
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    backgroundColor: "#000",
  },
  backgroundColor: "#000",
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    backgroundColor: "#000",
    supportsTablet: true,
    bundleIdentifier: "org.reactjs.native.example.fissa",
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    backgroundColor: "#000",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000",
    },
  },
  extra: {
    vercelUrl: "https://t3-fissa-nextjs.vercel.app",
    spotifyClientId: "a2a88c4618324942859ce3e1f888b938",
    eas: {
      projectId: "89f5d2ef-e72d-4e2c-a88c-3fe56e30e601",
    },
  },
  plugins: ["./expo-plugins/with-modify-gradle.js"],
});

export default defineConfig;
