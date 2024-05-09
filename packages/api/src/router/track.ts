import { z } from "zod";

import { TrackService } from "../service/TrackService";
import { VoteService } from "../service/VoteService";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const addTracks = z.object({
  pin: Z_PIN,
  tracks: Z_TRACKS,
});

const deleteTrack = z.object({
  pin: Z_PIN,
  trackId: z.string(),
});

export const trackRouter = createTRPCRouter({
  byPin: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new TrackService(ctx, new VoteService(ctx));
    return service.byPin(input);
  }),
  addTracks: protectedProcedure.input(addTracks).mutation(async ({ ctx, input }) => {
    const service = new TrackService(ctx, new VoteService(ctx));
    return service.addTracks(input.pin, input.tracks, ctx.session.user.id);
  }),
  deleteTrack: protectedProcedure.input(deleteTrack).mutation(async ({ ctx, input }) => {
    const service = new TrackService(ctx, new VoteService(ctx));
    await service.deleteTrack(input.pin, input.trackId);
  }),
});
