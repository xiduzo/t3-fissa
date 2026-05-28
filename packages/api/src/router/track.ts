import { z } from "zod";

import { createContainer } from "../container";
import { fissaEvents } from "../events/FissaEvents";
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
  addTracks: protectedProcedure.input(addTracks).mutation(async ({ ctx, input }) => {
    await createContainer(ctx).trackRepo.addTracks(input.pin, input.tracks, ctx.session.user.id);
    fissaEvents.publish(input.pin);
  }),
  deleteTrack: protectedProcedure.input(deleteTrack).mutation(async ({ ctx, input }) => {
    await createContainer(ctx).trackRepo.delete(input.pin, input.trackId);
    fissaEvents.publish(input.pin);
  }),
});
