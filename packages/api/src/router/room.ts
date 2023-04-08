import { z } from "zod";

import { RoomService } from "../service/RoomService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const trackIds = Z_TRACKS;

const nextTrack = z.object({
  pin: Z_PIN,
  currentIndex: z.number().min(0),
});

const sync = createTRPCRouter({
  // TODO: protect this and only admins should be able to do this
  active: publicProcedure.query(({ ctx }) => {
    const service = new RoomService(ctx);
    return service.activeRooms();
  }),
  // TODO: protect this and only admins should be able to do this
  next: publicProcedure.input(nextTrack).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.playNextTrack(input.pin, input.currentIndex);
  }),
});

export const roomRouter = createTRPCRouter({
  skipTrack: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.skipTrack(input);
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.restart(input);
  }),
  create: protectedProcedure.input(trackIds).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.create(input);
  }),
  byId: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.byId(input);
  }),
  detailsById: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.detailsById(input);
  }),
  sync,
});
