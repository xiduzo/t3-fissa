import { z } from "zod";

import { VoteService } from "../service/VoteService";
import { createTRPCRouter, protectedProcedure } from "../trpc";
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
  byTrack: protectedProcedure.input(vote).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVotes(input.pin, input.trackId);
  }),
  byFissa: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVotesByFissa(input);
  }),
  byTrackFromUser: protectedProcedure.input(vote).query(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.getVoteFromUser(input.pin, input.trackId, ctx.session.user.id);
  }),
  create: protectedProcedure.input(createVote).mutation(async ({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.createVote(input.pin, input.trackId, input.vote, ctx.session.user.id);
  }),
});
