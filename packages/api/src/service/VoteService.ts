import { ServiceWithContext, type Context } from "../utils/context";

export class VoteService extends ServiceWithContext {
  constructor(ctx: Context) {
    super(ctx);
  }

  getVotesFromTrack = async (pin: string, trackId: string) => {
    return this.db.vote.findMany({ where: { pin, trackId } });
  }

  getUserVote = async (pin: string, trackId: string, userId: string) => {
    return this.db.vote.findUnique({ where: { trackId_userId_pin: { pin, trackId, userId } } });
  };

  getVotesByFissa = async (pin: string) => {
    const votes = await this.db.vote.findMany({ where: { pin } });

    return votes.reduce(
      (acc, { trackId, vote }) => acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );
  };

  createVote = async (pin: string, trackId: string, vote: number, userId: string) => {
    return this.db.$transaction(async (transaction) => {
      await transaction.track.update({
        where: { pin_trackId: { pin, trackId } },
        data: { score: { increment: vote }, totalScore: { increment: vote } }
      })

      return transaction.vote.upsert({
        where: { trackId_userId_pin: { pin, trackId, userId } },
        create: { pin, trackId, vote, userId },
        update: { vote },
      })
    })
  };

  createVotes = async (pin: string, trackIds: string[], vote: number, userId: string) => {
    return this.db.$transaction(async (transaction) => {
      await transaction.vote.deleteMany({
        where: { pin, trackId: { in: trackIds }, userId },
      });

      await transaction.track.updateMany({
        data: { score: { increment: vote }, totalScore: { increment: vote } },
        where: { pin, trackId: { in: trackIds } }
      })

      return transaction.vote.createMany({
        data: trackIds.map((trackId) => ({ pin, trackId, vote, userId })),
      });
    });
  };

  resetVotes = async (pin:string, trackId: string) => {
    return this.db.vote.deleteMany({ where: { pin, trackId} })
  }
}
