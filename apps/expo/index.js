// This is the entry point for the Expo app.
// It is responsible for setting up the router, root component and loading pages.
import "expo-router/entry";

import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://b107ae36171541b58896d22738c2a6bc@o4504055699996672.ingest.sentry.io/4504055702880256",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});