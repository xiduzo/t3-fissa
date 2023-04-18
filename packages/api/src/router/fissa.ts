import { z } from "zod";

import { FissaService } from "../service/FissaService";
import {
  createTRPCRouter,
  protectedProcedure,
  serviceProcedure,
} from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const nextTrack = z.object({
  pin: Z_PIN,
  currentIndex: z.number().min(0),
});

const reorder = z.object({
  pin: Z_PIN,
  newCurrentIndex: z.number().min(0),
  updates: z.array(
    z.object({
      where: z.object({ trackId: z.string() }),
      data: z.object({ index: z.number().min(0) }),
    }),
  ),
});

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    const service = new FissaService(ctx);
    return service.activeFissas();
  }),
  // TODO: protect this and only admins should be able to do this
  next: serviceProcedure.input(nextTrack).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.playNextTrack(input.pin, true);
  }),
  reorder: serviceProcedure.input(reorder).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return true;
  }),
});

export const fissaRouter = createTRPCRouter({
  skipTrack: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.skipTrack(input);
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.restart(input);
  }),
  create: protectedProcedure.input(Z_TRACKS).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.create(input);
  }),
  byId: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.byId(input);
  }),
  detailsById: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.detailsById(input);
  }),
  sync,
});
