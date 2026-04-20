import { authRouter } from "./router/auth";
import { fissaRouter } from "./router/fissa";
import { spotifyRouter } from "./router/spotify";
import { trackRouter } from "./router/track";
import { voteRouter } from "./router/vote";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  fissa: fissaRouter,
  spotify: spotifyRouter,
  track: trackRouter,
  vote: voteRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
