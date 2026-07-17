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
    return createContainer(ctx).trackRepo.findByPin(input);
  }),
  addTracks: protectedProcedure.input(addTracks).mutation(({ ctx, input }) => {
    return createContainer(ctx).trackRepo.addTracks(input.pin, input.tracks, ctx.session.user.id);
  }),
  deleteTrack: protectedProcedure.input(deleteTrack).mutation(({ ctx, input }) => {
    return createContainer(ctx).trackRepo.delete(input.pin, input.trackId);
  }),
});
