import { ServiceWithContext } from "../utils/context";

export class VoteService extends ServiceWithContext {
  getVotes = async (pin: string, trackId: string) => {
    return this.db.vote.findMany({
      where: { pin, trackId },
    });
  };

  getVotesByRoom = async (pin: string) => {
    const votes = await this.db.vote.findMany({
      where: { pin },
    });

    return votes.reduce(
      (acc, { trackId, vote }) =>
        acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );
  };

  getVoteFromUser = async (pin: string, trackId: string) => {
    return this.db.vote.findFirstOrThrow({
      where: { pin, trackId, userId: this.ctx.session?.user.id },
    });
  };

  createVote = async (pin: string, trackId: string, vote: number) => {
    const userId = this.ctx.session?.user.id!;

    const response = await this.db.vote.upsert({
      where: { trackId_userId_pin: { pin, trackId, userId } },
      create: { pin, trackId, vote, userId },
      update: { vote },
    });

    await this.updateScores(pin, [trackId], vote);

    return response;
  };

  createVotes = async (pin: string, trackIds: string[], vote: number) => {
    await this.db.$transaction(async (transaction) => {
      await transaction.vote.deleteMany({
        where: {
          pin,
          trackId: { in: trackIds },
          userId: this.ctx.session?.user.id!,
        },
      });

      return transaction.vote.createMany({
        data: trackIds.map((trackId) => ({
          pin,
          trackId,
          vote,
          userId: this.ctx.session?.user.id!,
        })),
      });
    });

    return this.updateScores(pin, trackIds, vote);
  };

  private updateScores = async (
    pin: string,
    trackIds: string[],
    increment: number,
  ) => {
    return this.db.track.updateMany({
      where: { pin, trackId: { in: trackIds } },
      data: { score: { increment } },
    });
  };
}
