import { RoomService } from "../service/RoomService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const trackIds = Z_TRACKS;

export const roomRouter = createTRPCRouter({
  create: protectedProcedure.input(trackIds).mutation(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.create(input);
  }),
  byId: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.byId(input);
  }),
});
