import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    SPOTIFY_CLIENT_ID: z.string().min(1),
    SPOTIFY_CLIENT_SECRET: z.string().min(1),
    WEB_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z.string().default("silly"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
