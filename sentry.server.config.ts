import * as Sentry from "@sentry/nextjs";
import { cookies, headers } from "next/headers";
import { decode } from "next-auth/jwt";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  debug: false,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV || "production",
  release: process.env.APP_VERSION,
  async beforeSend(event, hint) {
    try {
      const headersList = await headers();
      const requestId = headersList.get("x-request-id") || headersList.get("x-correlation-id") || headersList.get("x-request-correlation-id");
      if (requestId) {
        event.tags = {
          ...event.tags,
          requestId,
          correlationId: requestId,
        };
      }

      const requestPath = headersList.get("x-invoke-path") || (event.request?.url ? new URL(event.request.url).pathname : undefined);
      if (requestPath) {
        event.tags = {
          ...event.tags,
          requestPath,
        };
      }

      const cookiesList = await cookies();
      const sessionCookie = 
        cookiesList.get("__Secure-next-auth.session-token")?.value ||
        cookiesList.get("next-auth.session-token")?.value;

      if (sessionCookie && process.env.NEXTAUTH_SECRET) {
        const decoded = await decode({
          token: sessionCookie,
          secret: process.env.NEXTAUTH_SECRET,
        });
        if (decoded?.sub) {
          event.user = {
            ...event.user,
            id: decoded.sub,
            email: decoded.email || undefined,
            name: decoded.name || undefined,
          };
        }
      }
    } catch (e) {
      // Ignore errors when called outside of request context (e.g. build time)
    }
    return event;
  }
});

// Patch console.error to report errors to Sentry
let isInsideConsoleErrorPatch = false;
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  originalConsoleError(...args);

  if (isInsideConsoleErrorPatch) return;
  isInsideConsoleErrorPatch = true;

  try {
    const errorArg = args.find((arg) => arg instanceof Error);
    if (errorArg) {
      if (!(errorArg as any).__sentry_captured__) {
        (errorArg as any).__sentry_captured__ = true;
        Sentry.captureException(errorArg);
      }
    } else if (args.length > 0) {
      const message = args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
        .join(" ");
      if (message.includes("error") || message.includes("❌")) {
        Sentry.captureMessage(message);
      }
    }
  } catch (e) {
    // Prevent recursive loop
  } finally {
    isInsideConsoleErrorPatch = false;
  }
};
