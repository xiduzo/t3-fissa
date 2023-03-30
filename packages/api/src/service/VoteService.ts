import { VOTE } from "@fissa/db";

import { ServiceWithContext } from "../utils/context";
import { RoomService } from "./RoomService";

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

    return votes.reduce((acc, { trackId, vote }) => {
      const count = acc.get(trackId) || 0;
      const increment = vote === VOTE.UP ? 1 : -1;
      acc.set(trackId, count + increment);
      return acc;
    }, new Map<string, number>());
  };

  getVoteFromUser = async (pin: string, trackId: string) => {
    return this.db.vote.findFirstOrThrow({
      where: { pin, trackId, userId: this.ctx.session?.user.id },
    });
  };

  createVote = async (pin: string, trackId: string, vote: VOTE) => {
    const roomService = new RoomService(this.ctx);

    const userId = this.ctx.session?.user.id!;

    const response = await this.db.vote.upsert({
      where: { trackId_userId_pin: { pin, trackId, userId } },
      create: { pin, trackId, vote, userId },
      update: { vote },
    });

    await roomService.reorderPlaylist(pin);

    return response;
  };
}
