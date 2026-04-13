import { z } from "zod";

import { createContainer } from "../container";
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
    return createContainer(ctx).trackService.byPin(input);
  }),
  addTracks: protectedProcedure.input(addTracks).mutation(async ({ ctx, input }) => {
    return createContainer(ctx).trackService.addTracks(input.pin, input.tracks, ctx.session.user.id);
  }),
  deleteTrack: protectedProcedure.input(deleteTrack).mutation(async ({ ctx, input }) => {
    await createContainer(ctx).trackService.deleteTrack(input.pin, input.trackId);
  }),
});
