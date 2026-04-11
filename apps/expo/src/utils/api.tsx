import React, { useState } from "react";
import Constants from "expo-constants";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@fissa/api";
import superjson from "superjson";

// relative path import to prevent circular dependency
import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from "../hooks/useEncryptedStorage";
import { sqliteStorage } from "./sqlite-storage";

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
 * Extends this function when going to production by
 * setting the SERVER_URL to your production API URL.
 */
const getBaseUrl = () => {
  const config = Constants.expoConfig as { hostUri?: string; extra?: { serverUrl?: string } };

  const localhost = config.hostUri?.split(":")[0];
  if (!localhost) {
    return process.env.SERVER_URL ?? config.extra?.serverUrl ?? "http://localhost:3000";
  }

  return `http://${localhost}:3000`;
};

/** 24 hours — how long persisted query data survives. */
const CACHE_TIME_MS = 24 * 60 * 60 * 1000;

const queryPersister = createAsyncStoragePersister({
  storage: sqliteStorage,
  key: "fissa-query-cache",
});

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getValueFor } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.sessionToken);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: CACHE_TIME_MS,
            // Stale-while-revalidate: serve cached data instantly, refetch behind the scenes
            staleTime: 0,
            refetchOnMount: "always",
            refetchOnReconnect: "always",
            refetchOnWindowFocus: "always",
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers: async () => {
            return {
              authorization: `Bearer ${(await getValueFor()) ?? ""}`,
            };
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: CACHE_TIME_MS }}
      >
        {children}
      </PersistQueryClientProvider>
    </api.Provider>
  );
};
