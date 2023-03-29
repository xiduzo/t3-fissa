import { VOTE } from "@fissa/db";

import { ServiceWithContext } from "../utils/context";
import { RoomService } from "./RoomService";

export class VoteService extends ServiceWithContext {
  getVotes = async (roomId: string, trackId: string) => {
    return this.db.vote.findMany({
      where: { roomId, trackId },
    });
  };

  getVotesByRoom = async (roomId: string) => {
    const votes = await this.db.vote.findMany({
      where: { roomId },
    });

    return votes.reduce((acc, { trackId, vote }) => {
      const count = acc.get(trackId) || 0;
      const increment = vote === VOTE.UP ? 1 : -1;
      acc.set(trackId, count + increment);
      return acc;
    }, new Map<string, number>());
  };

  getVoteFromUser = async (roomId: string, trackId: string) => {
    return this.db.vote.findFirstOrThrow({
      where: { roomId, trackId, userId: this.ctx.session?.user.id },
    });
  };

  createVote = async (roomId: string, trackId: string, vote: VOTE) => {
    const roomService = new RoomService(this.ctx);

    const userId = this.ctx.session?.user.id!;

    const response = await this.db.vote.upsert({
      where: { trackId_userId_roomId: { roomId, trackId, userId } },
      create: { roomId, trackId, vote, userId },
      update: { vote },
    });

    await roomService.reorderPlaylist(roomId);

    return response;
  };
}
