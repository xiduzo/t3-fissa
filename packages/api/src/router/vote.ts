import { z } from "zod";

import { RoomService } from "../service/RoomService";
import { VoteService } from "../service/VoteService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACK_ID } from "./constants";

const vote = z.object({
  pin: Z_PIN,
  trackId: Z_TRACK_ID,
});

const createVote = vote.extend({
  vote: z
    .number()
    .min(-1)
    .max(1)
    .refine((vote) => vote !== 0),
});

export const voteRouter = createTRPCRouter({
  byTrack: publicProcedure.input(vote).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVotes(input.pin, input.trackId);
  }),
  byRoom: publicProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVotesByRoom(input);
  }),
  byTrackFromUser: protectedProcedure.input(vote).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVoteFromUser(input.pin, input.trackId);
  }),
  create: protectedProcedure
    .input(createVote)
    .mutation(async ({ ctx, input }) => {
      const service = new VoteService(ctx);
      const roomService = new RoomService(ctx);

      const vote = await service.createVote(
        input.pin,
        input.trackId,
        input.vote,
      );

      await roomService.reorderPlaylist(input.pin);

      return vote;
    }),
});
