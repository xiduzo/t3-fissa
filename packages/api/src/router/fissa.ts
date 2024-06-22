import { SpotifyService } from "@fissa/utils";

import { BadgeService } from "../service/BadgeService";
import { FissaService } from "../service/FissaService";
import { createTRPCRouter, protectedProcedure, publicProcedure, serviceProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.activeFissas();
  }),
  next: serviceProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.playNextTrack(input);
  }),
});

export const fissaRouter = createTRPCRouter({
  skipTrack: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.skipTrack(input, ctx.session.user.id);
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.restart(input, ctx.session.user.id);
  }),
  create: protectedProcedure.input(Z_TRACKS).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.create(input, ctx.session.user.id);
  }),
  byId: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.byId(input, ctx.session?.user.id);
  }),
  members: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.members(input);
  }),
  pause: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new FissaService(ctx, new SpotifyService(), new BadgeService(ctx));
    return service.pause(input, ctx.session.user.id);
  }),
  sync,
});
