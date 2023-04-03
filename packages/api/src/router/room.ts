import { z } from "zod";



import { RoomService } from "../service/RoomService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";


const trackIds = Z_TRACKS;

const nextTrack = z.object({
  pin: Z_PIN,
  currentIndex: z.number().positive()
});

export const roomRouter = createTRPCRouter({
  // TODO: protect this and only admins should be able to do this
  all: publicProcedure.query(({ ctx }) => {
    const service = new RoomService(ctx);
    return service.all();
  }),
  skipTrack: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.skipTrack(input);
  }),
  // TODO: protect this and only admins should be able to do this
  nextTrack: publicProcedure.input(nextTrack).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.nextTrack(input.pin, input.currentIndex);
  }),
  restart: protectedProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.restart(input);
  }),
  create: protectedProcedure.input(trackIds).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.create(input);
  }),
  byId: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.byId(input);
  }),
  detailsById: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.detailsById(input);
  }),
});