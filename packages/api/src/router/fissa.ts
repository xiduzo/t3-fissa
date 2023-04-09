import { z } from "zod";

import { FissaService } from "../service/FissaService";
import {
  createTRPCRouter,
  protectedProcedure,
  serviceProcedure,
} from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const trackIds = Z_TRACKS;

const nextTrack = z.object({
  pin: Z_PIN,
  currentIndex: z.number().min(0),
});

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    const service = new FissaService(ctx);
    return service.activeFissas();
  }),
  // TODO: protect this and only admins should be able to do this
  next: serviceProcedure.input(nextTrack).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.playNextTrack(input.pin, input.currentIndex);
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
  create: protectedProcedure.input(trackIds).mutation(({ ctx, input }) => {
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
