import { RoomService } from "../service/RoomService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const trackIds = Z_TRACKS;

export const roomRouter = createTRPCRouter({
  // TODO: protect this and only admins should be able to do this
  all: publicProcedure.query(({ ctx }) => {
    const service = new RoomService(ctx);
    return service.all();
  }),
  nextTrack: publicProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.nextTrack(input);
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
