import { ServiceWithContext } from "../utils/context";

export class VoteService extends ServiceWithContext {
  getVotes = async (pin: string, trackId: string) => {
    return this.db.vote.findMany({
      where: { pin, trackId },
    });
  };

  getVotesByFissa = async (pin: string) => {
    const votes = await this.db.vote.findMany({
      where: { pin },
    });

    return votes.reduce(
      (acc, { trackId, vote }) => acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );
  };

  getVoteFromUser = async (pin: string, trackId: string, userId: string) => {
    return this.db.vote.findUnique({
      where: { trackId_userId_pin: { pin, trackId, userId } },
    });
  };

  createVote = async (pin: string, trackId: string, vote: number, userId: string) => {
    const response = await this.db.vote.upsert({
      where: { trackId_userId_pin: { pin, trackId, userId } },
      create: { pin, trackId, vote, userId },
      update: { vote },
    });

    await this.updateCurrentScores(pin, [trackId], vote);

    return response;
  };

  createVotes = async (pin: string, trackIds: string[], vote: number, userId: string) => {
    await this.db.$transaction(async (transaction) => {
      await transaction.vote.deleteMany({
        where: { pin, trackId: { in: trackIds }, userId },
      });
      await transaction.vote.createMany({
        data: trackIds.map((trackId) => ({ pin, trackId, vote, userId })),
      });
    });

    return this.updateCurrentScores(pin, trackIds, vote);
  };

  private updateCurrentScores = async (pin: string, trackIds: string[], vote: number) => {
    const scores = await this.db.vote.findMany({
      where: { pin, trackId: { in: trackIds } },
    });

    const update = scores.reduce(
      (acc, { trackId, vote }) => acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );

    return this.db.fissa.update({
      where: { pin },
      data: {
        tracks: {
          updateMany: Array.from(update.entries()).map(([trackId, score]) => ({
            where: { pin, trackId },
            data: {
              score,
              totalScore: { increment: vote }, // Make sure the total score reflects the vote so it won't be picked when adding to the queue
              hasBeenPlayed: false, // Whenever we cast a vote, this means either the track is in the queue or will be put there because of the vote
            },
          })),
        },
      },
    });
  };
}
