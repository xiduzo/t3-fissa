// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ConfigContext, ExpoConfig } from "@expo/config";

const version = "3.3.0"; // EAS VERSION
// Should be bumped every time a new build is made
const buildNumber = "4"; // EAS VERSION

const defineConfig = (_ctx: ConfigContext): ExpoConfig => ({
  name: "fissa",
  slug: "fissa",
  scheme: "com.fissa",
  version,
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    backgroundColor: "#000",
  },
  backgroundColor: "#000",
  updates: {
    fallbackToCacheTimeout: 10 * 1000,
    url: "https://u.expo.dev/89f5d2ef-e72d-4e2c-a88c-3fe56e30e601",
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    buildNumber,
    supportsTablet: true,
    bundleIdentifier: "org.reactjs.native.example.fissa",
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    versionCode: Number(
      version.replace(".", "").replace(".", "") + buildNumber,
    ),
    package: "com.fissa",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#000",
    },
  },
  extra: {
    vercelUrl: "https://fissa-houseparty.vercel.app",
    spotifyClientId: "a2a88c4618324942859ce3e1f888b938",
    eas: {
      projectId: "89f5d2ef-e72d-4e2c-a88c-3fe56e30e601",
    },
  },
  plugins: [
    "./expo-plugins/with-modify-gradle.js",
    [
      "expo-updates",
      {
        username: "xiduzo",
      },
    ],
  ],
});

export default defineConfig;
