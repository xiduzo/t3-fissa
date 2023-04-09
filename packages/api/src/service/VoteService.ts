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
    return this.db.vote.findUnique({
      where: {
        trackId_userId_pin: {
          pin,
          trackId,
          userId: this.ctx.session?.user.id!,
        },
      },
    });
  };

  createVote = async (pin: string, trackId: string, vote: number) => {
    const userId = this.ctx.session?.user.id!;

    const response = await this.db.vote.upsert({
      where: { trackId_userId_pin: { pin, trackId, userId } },
      create: { pin, trackId, vote, userId },
      update: { vote },
    });

    await this.updateScores(pin, [trackId]);

    return response;
  };

  createVotes = async (pin: string, trackIds: string[], vote: number) => {
    await this.db.$transaction(async (transaction) => {
      const userId = this.ctx.session?.user.id!;
      await transaction.vote.deleteMany({
        where: { pin, trackId: { in: trackIds }, userId },
      });
      await this.db.vote.createMany({
        data: trackIds.map((trackId) => ({
          pin,
          trackId,
          vote,
          userId,
        })),
      });
    });

    return this.updateScores(pin, trackIds);
  };

  private updateScores = async (pin: string, trackIds: string[]) => {
    const scores = await this.db.vote.findMany({
      where: { pin, trackId: { in: trackIds } },
    });

    const update = scores.reduce(
      (acc, { trackId, vote }) =>
        acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );

    const updateMany = Array.from(update.entries()).map(([trackId, score]) => ({
      where: { pin, trackId },
      data: { score },
    }));

    return this.db.room.update({
      where: { pin },
      data: {
        shouldReorder: true,
        tracks: { updateMany },
      },
    });
  };
}
