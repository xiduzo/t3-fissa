import { z } from "zod";
import { VOTE } from "@fissa/db";

import { VoteService } from "../service/VoteService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACK_ID } from "./constants";

const vote = z.object({
  roomId: Z_PIN,
  trackId: Z_TRACK_ID,
});

const createVote = vote.extend({
  vote: z.nativeEnum(VOTE),
});

export const voteRouter = createTRPCRouter({
  byTrack: publicProcedure.input(vote).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVotes(input.roomId, input.trackId);
  }),
  byTrackFromUser: protectedProcedure.input(vote).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVoteFromUser(input.roomId, input.trackId);
  }),
  create: protectedProcedure.input(createVote).mutation(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.createVote(input.roomId, input.trackId, input.vote);
  }),
});
