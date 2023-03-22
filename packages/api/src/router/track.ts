import { z } from "zod";

import { TrackService } from "../service/TrackService";
import { createTRPCRouter, publicProcedure } from "../trpc";

const id = z.string().length(4);
export const addTracks = z.object({
  roomId: id,
  tracks: z.array(
    z.object({
      trackId: z.string().length(22),
      durationMs: z.number(),
    }),
  ),
});

export const trackRouter = createTRPCRouter({
  byRoomId: publicProcedure.input(id).query(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.byRoomId(input);
  }),

  addTracks: publicProcedure.input(addTracks).mutation(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.addTracks(input);
  }),
});
