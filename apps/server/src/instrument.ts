import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN_SERVER ?? "",
  tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
});
