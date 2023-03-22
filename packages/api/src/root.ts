import { authRouter } from "./router/auth";
import { roomRouter } from "./router/room";
import { trackRouter } from "./router/track";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  room: roomRouter,
  track: trackRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
