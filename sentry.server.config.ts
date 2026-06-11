import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  debug: false,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV || "production",
  release: process.env.APP_VERSION,
});
