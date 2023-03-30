import { z } from "zod";

import { TrackService } from "../service/TrackService";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const addTracks = z.object({
  pin: Z_PIN,
  tracks: Z_TRACKS,
});

export const trackRouter = createTRPCRouter({
  byPin: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.byPin(input);
  }),

  addTracks: publicProcedure.input(addTracks).mutation(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.addTracks(input.pin, input.tracks);
  }),
});
