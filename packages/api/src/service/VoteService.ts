import { VOTE } from "@fissa/db";

import { ServiceWithContext } from "../utils/context";

export class VoteService extends ServiceWithContext {
  getVotes = async (roomId: string, trackId: string) => {
    return this.db.vote.findMany({
      where: { roomId, trackId },
    });
  };

  getVoteFromUser = async (roomId: string, trackId: string) => {
    return this.db.vote.findMany({
      where: { roomId, trackId, userId: this.ctx.session?.user.id },
    });
  };

  createVote = async (roomId: string, trackId: string, vote: VOTE) => {
    return this.db.vote.create({
      data: {
        roomId,
        trackId,
        vote,
        userId: this.ctx.session!.user.id!,
      },
    });
  };
}
