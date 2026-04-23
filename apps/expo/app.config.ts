// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ConfigContext, ExpoConfig } from "@expo/config";

const version = "4.0.1"; // EAS VERSION
// Should be bumped every time a new build is made
const buildNumber = "1"; // EAS VERSION

const defineConfig = (_ctx: ConfigContext): ExpoConfig => ({
  name: "fissa",
  slug: "fissa",
  scheme: "com.fissa",
  version,
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "cover",
    backgroundColor: "#050505",
  },
  backgroundColor: "#050505",
  updates: {
    fallbackToCacheTimeout: 10 * 1000,
    url: "https://u.expo.dev/89f5d2ef-e72d-4e2c-a88c-3fe56e30e601",
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  assetBundlePatterns: ["**/*"],
  newArchEnabled: true,
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
      backgroundColor: "#050505",
    },
  },
  extra: {
    serverUrl: process.env.SERVER_URL ?? "https://api.fissa.online",
    spotifyClientId: "a2a88c4618324942859ce3e1f888b938",
    sentryDsn: process.env.SENTRY_DSN_MOBILE ?? "https://b107ae36171541b58896d22738c2a6bc@o4504055699996672.ingest.us.sentry.io/4504055702880256",
    eas: {
      projectId: "89f5d2ef-e72d-4e2c-a88c-3fe56e30e601",
    },
  },
  plugins: [
    "./expo-plugins/with-modify-gradle.js",
    "expo-dev-client",
    [
      "@sentry/react-native",
      {
        organization: process.env.SENTRY_ORG ?? "fissa",
        project: process.env.SENTRY_PROJECT ?? "fissa-expo",
      },
    ],
    "expo-secure-store",
    "expo-router",
    "expo-sqlite",
    [
      "expo-updates",
      {
        username: "xiduzo",
      },
    ],
  ],
});

export default defineConfig;
