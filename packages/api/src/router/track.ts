import { z } from "zod";

import { TrackService } from "../service/TrackService";
import { createTRPCRouter, publicProcedure } from "../trpc";

const id = z.string().length(4);

export const trackRouter = createTRPCRouter({
  byRoomId: publicProcedure.input(id).query(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.byRoomId(input);
  }),
});
