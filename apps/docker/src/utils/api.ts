import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "@fissa/api";
import { transformer } from "@fissa/api/transformer";

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
const getBaseUrl = () => {
  /**
   * Gets the IP address of your host-machine. If it cannot automatically find it,
   * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
   * you don't have anything else running on it, or you'd have to change it.
   */
  if (process.env.VERCEL_URL) return process.env.VERCEL_URL; // SSR should use vercel url

  return `http://localhost:3000`; // dev SSR should use localhost
};

console.log(getBaseUrl());

export const api = createTRPCProxyClient<AppRouter>({
  transformer,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      // You can pass any HTTP headers you wish here
      async headers() {
        return {
          //   authorization: getAuthCookie(),
        };
      },
    }),
  ],
});
