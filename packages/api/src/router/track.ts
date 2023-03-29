import { z } from "zod";

import { TrackService } from "../service/TrackService";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const addTracks = z.object({
  roomId: Z_PIN,
  tracks: Z_TRACKS,
});

export const trackRouter = createTRPCRouter({
  byRoomId: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.byRoomId(input);
  }),

  addTracks: publicProcedure.input(addTracks).mutation(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.addTracks(input.roomId, input.tracks);
  }),
});
