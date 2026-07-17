import { createContainer } from "../container";
import { fissaEvents } from "../events/FissaEvents";
import { createTRPCRouter, protectedProcedure, publicProcedure, serviceProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const sync = createTRPCRouter({
  active: serviceProcedure.query(({ ctx }) => {
    return createContainer(ctx).fissaService.activeFissas();
  }),
  next: serviceProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    // Orchestrator-driven track advance — the main reason a queue moves.
    return createContainer(ctx).playbackService.playNext(input);
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
  /**
   * Live change feed for a single Fissa, delivered over SSE. Yields the pin on
   * every queue/vote/playback change so the client can refresh `byId` instead
   * of polling on a fixed interval. Public — mirrors `byId`'s visibility.
   *
   * Mutations publish to `fissaEvents` themselves, at the seam where they
   * commit (services + TrackRepository) — routers stay transport-only.
   */
  onUpdate: publicProcedure.input(Z_PIN).subscription(async function* ({ input, signal }) {
    yield* fissaEvents.subscribe(input, signal!);
  }),
  sync,
});
