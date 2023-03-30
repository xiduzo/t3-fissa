import { z } from "zod";

import { RoomService } from "../service/RoomService";
import { TrackService } from "../service/TrackService";
import { VoteService } from "../service/VoteService";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACKS } from "./constants";

const addTracks = z.object({
  pin: Z_PIN,
  tracks: Z_TRACKS,
});

export const trackRouter = createTRPCRouter({
  byPin: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new TrackService(ctx);
    return service.byPin(input);
  }),

  addTracks: publicProcedure
    .input(addTracks)
    .mutation(async ({ ctx, input }) => {
      const service = new TrackService(ctx);

      const duplicatedTracks = await service.addTracks(input.pin, input.tracks);

      if (duplicatedTracks.length) {
        const voteService = new VoteService(ctx);
        await voteService.createVotes(input.pin, duplicatedTracks, 1);

        const roomService = new RoomService(ctx);
        await roomService.reorderPlaylist(input.pin);
      }
    }),
});
