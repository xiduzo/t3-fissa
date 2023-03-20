import { z } from "zod";

import { RoomService } from "../service/RoomService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const id = z.string().length(4);

export const roomRouter = createTRPCRouter({
  create: protectedProcedure.mutation(({ ctx }) => {
    const service = new RoomService(ctx);
    return service.create();
  }),
  byId: publicProcedure.input(id).query(({ ctx, input }) => {
    const service = new RoomService(ctx);
    return service.byId(input);
  }),
});
