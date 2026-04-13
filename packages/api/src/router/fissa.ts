import { createContainer } from "../container";
import { createTRPCRouter, protectedProcedure, publicProcedure, serviceProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    return createContainer(ctx).fissaService.activeFissas();
  }),
  next: serviceProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    return createContainer(ctx).fissaService.playNextTrack(input);
  }),
});

export const fissaRouter = createTRPCRouter({
  activeFissaCount: publicProcedure.query(({ ctx }) => {
    return createContainer(ctx).fissaService.activeFissasCount();
  }),
  skipTrack: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    return createContainer(ctx).fissaService.skipTrack(input, ctx.session.user.id);
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    return createContainer(ctx).fissaService.restart(input, ctx.session.user.id);
  }),
  create: protectedProcedure.input(Z_TRACKS).mutation(({ ctx, input }) => {
    return createContainer(ctx).fissaService.create(input, ctx.session.user.id);
  }),
  byId: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    return createContainer(ctx).fissaService.byId(input);
  }),
  join: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    return createContainer(ctx).fissaService.join(input, ctx.session.user.id);
  }),
  members: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    return createContainer(ctx).fissaService.members(input);
  }),
  pause: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    return createContainer(ctx).fissaService.pause(input, ctx.session.user.id);
  }),
  sync,
});
