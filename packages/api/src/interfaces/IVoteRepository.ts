import type { InferSelectModel } from "@fissa/db";
import type { votes } from "@fissa/db";

export type Vote = InferSelectModel<typeof votes>;

export interface IVoteRepository {
  findByTrack(pin: string, trackId: string): Promise<Vote[]>;

  findByUser(pin: string, trackId: string, userId: string): Promise<Vote | undefined>;

  findByFissa(pin: string): Promise<Vote[]>;

  findByFissaFromUser(pin: string, userId: string): Promise<Vote[]>;
}
