import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@fissa/api";

export const api = createTRPCReact<AppRouter>();
