import { createContainer } from "../container";
import { fissaEvents } from "../events/FissaEvents";
import { createTRPCRouter, protectedProcedure, publicProcedure, serviceProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    return createContainer(ctx).fissaService.activeFissas();
  }),
  next: serviceProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    const result = await createContainer(ctx).playbackService.playNext(input);
    // Orchestrator-driven track advance — the main reason a queue moves.
    fissaEvents.publish(input);
    return result;
  }),
});

export const fissaRouter = createTRPCRouter({
  activeFissaCount: publicProcedure.query(({ ctx }) => {
    return createContainer(ctx).fissaService.activeFissasCount();
  }),
  skipTrack: protectedProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    const result = await createContainer(ctx).fissaService.skipTrack(input, ctx.session.user.id);
    fissaEvents.publish(input);
    return result;
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    const result = await createContainer(ctx).fissaService.restart(input, ctx.session.user.id);
    fissaEvents.publish(input);
    return result;
  }),
  create: protectedProcedure.input(Z_TRACKS).mutation(async ({ ctx, input }) => {
    const fissa = await createContainer(ctx).fissaService.create(input, ctx.session.user.id);
    fissaEvents.publish(fissa.pin);
    return fissa;
  }),
  byId: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    return createContainer(ctx).fissaService.byId(input);
  }),
  join: protectedProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    const result = await createContainer(ctx).fissaService.join(input, ctx.session.user.id);
    fissaEvents.publish(input);
    return result;
  }),
  members: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    return createContainer(ctx).fissaService.members(input);
  }),
  pause: protectedProcedure.input(Z_PIN).mutation(async ({ ctx, input }) => {
    const result = await createContainer(ctx).fissaService.pause(input, ctx.session.user.id);
    fissaEvents.publish(input);
    return result;
  }),
  /**
   * Live change feed for a single Fissa, delivered over SSE. Yields the pin on
   * every queue/vote/playback change so the client can refresh `byId` instead
   * of polling on a fixed interval. Public — mirrors `byId`'s visibility.
   */
  onUpdate: publicProcedure.input(Z_PIN).subscription(async function* ({ input, signal }) {
    yield* fissaEvents.subscribe(input, signal!);
  }),
  sync,
});
