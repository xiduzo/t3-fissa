import type { InferSelectModel } from "@fissa/db";
import type { votes } from "@fissa/db";

export type Vote = InferSelectModel<typeof votes>;

/**
 * Vote reads come in two flavours: raw vote rows (for UIs that show
 * individual reactions) and the aggregated per-track Score (for queue order).
 * Score is a derived value that the Track aggregate owns at write time
 * (CONTEXT.md), but readers often want the net rather than the row list —
 * `getScoresByFissa` hides the sum so callers don't recompute it.
 */
export interface IVoteRepository {
  findByTrack(pin: string, trackId: string): Promise<Vote[]>;

  findByUser(pin: string, trackId: string, userId: string): Promise<Vote | undefined>;

  findByFissa(pin: string): Promise<Vote[]>;

  findByFissaFromUser(pin: string, userId: string): Promise<Vote[]>;

  /** Net Score per track in this fissa — votes summed by `trackId`. */
  getScoresByFissa(pin: string): Promise<Map<string, number>>;
}
