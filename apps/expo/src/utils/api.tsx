import React, { useState } from "react";
import Constants from "expo-constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@fissa/api";
import { transformer } from "@fissa/api/transformer";

// relative path import to prevent circular dependency
import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from "../hooks/useEncryptedStorage";

/**
 * A set of type-safe hooks for consuming your API.
 */
export const api = createTRPCReact<AppRouter>();

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;

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
  const config = Constants.expoConfig as { hostUri?: string; extra?: { vercelUrl?: string } };

  const localhost = config.hostUri?.split(":")[0];
  if (!localhost) {
    return process.env.VERCEL_URL ?? config.extra?.vercelUrl;
  }

  return `http://${localhost}:3000`;
};

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getValueFor } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.sessionToken);

  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers: async () => {
            return {
              authorization: (await getValueFor()) ?? "",
            };
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
};
