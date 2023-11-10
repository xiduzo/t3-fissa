import { SpotifyService } from "@fissa/utils";

import { FissaService } from "../service/FissaService";
import { createTRPCRouter, protectedProcedure, serviceProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.activeFissas();
  }),
  next: serviceProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.playNextTrack(input);
  }),
});

export const fissaRouter = createTRPCRouter({
  skipTrack: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.skipTrack(input);
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.restart(input);
  }),
  create: protectedProcedure.input(Z_TRACKS).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.create(input);
  }),
  byId: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.byId(input);
  }),
  detailsById: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.detailsById(input);
  }),
  sync,
});
