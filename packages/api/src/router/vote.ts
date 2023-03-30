import { z } from "zod";
import { VOTE } from "@fissa/db";

import { VoteService } from "../service/VoteService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { Z_PIN, Z_TRACK_ID } from "./constants";

const vote = z.object({
  pin: Z_PIN,
  trackId: Z_TRACK_ID,
});

const createVote = vote.extend({
  vote: z.nativeEnum(VOTE),
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
  create: protectedProcedure.input(createVote).mutation(({ ctx, input }) => {
    const service = new VoteService(ctx);
    return service.createVote(input.pin, input.trackId, input.vote);
  }),
});
