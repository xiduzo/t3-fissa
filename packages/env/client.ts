import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: z.string().url().default("http://localhost:3000"),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runtimeEnv: (import.meta as any).env as Record<string, string | undefined>,
});
