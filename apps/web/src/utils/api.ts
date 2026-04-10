import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@fissa/api";
import { transformer } from "@fissa/api/transformer";

export const api = createTRPCReact<AppRouter>();

const getBaseUrl = () =>
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const trpcClient = api.createClient({
  transformer,
  links: [
    loggerLink({
      enabled: (opts) =>
        import.meta.env.DEV ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
