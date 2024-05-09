import { SpotifyService } from "@fissa/utils";

import { FissaService } from "../service/FissaService";
import { createTRPCRouter, protectedProcedure, publicProcedure, serviceProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    const fissaService = new FissaService(ctx, new SpotifyService());
    return fissaService.activeFissas();
  }),
  next: serviceProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.playNextTrack(input);
  }),
});

export const fissaRouter = createTRPCRouter({
  skipTrack: protectedProcedure.input(Z_PIN).mutation(async({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.skipTrack(input, ctx.session.user.id);
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.restart(input, ctx.session.user.id);
  }),
  create: protectedProcedure.input(Z_TRACKS).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.create(input, ctx.session.user.id);
  }),
  byId: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.byId(input, ctx.session?.user.id);
  }),
  pause: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService());
    return service.pause(input, ctx.session.user.id);
  }),
  sync,
});
