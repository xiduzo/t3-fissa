import { z } from "zod";

import { FissaService } from "../service/FissaService";
import {
  createTRPCRouter,
  protectedProcedure,
  serviceProcedure,
} from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    const service = new FissaService(ctx);
    return service.activeFissas();
  }),
  next: serviceProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx);
    return service.playNextTrack(input);
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
