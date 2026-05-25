import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

/**
 * Build an absolute callback URL on the web app's own origin.
 *
 * The auth client's baseURL points at the API server (:3000), and Better Auth
 * resolves a *relative* callbackURL against that server origin — landing the
 * post-OAuth redirect on the server, where app routes like /fissa/create don't
 * exist (404). Handing it an absolute URL on window.location.origin sends the
 * user back to the web app instead.
 */
export function webCallbackUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}
