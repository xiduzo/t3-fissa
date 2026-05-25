/**
 * The points economy rules — one home for every number, replacing the
 * scattered `EarnedPoints` enum and inline `sql` deltas across the services.
 *
 * These are pure functions over the crowd's behaviour; the aggregates call
 * them and raise `PointsAwarded` events with the result.
 */

import type { VoteDirection } from "./events";

/**
 * A skipped track is mild negative feedback to its owner — a small flat
 * penalty. (History: was -20, which dwarfed the play reward and dragged
 * scores negative; see ADR-0001 / git log.)
 */
export const SKIP_PENALTY = -5;

/**
 * The delta a single re-castable vote applies to a track's score. Re-casting
 * replaces the prior vote, so the change is `next - previous`, never doubled.
 * A first vote has `previous = 0`.
 */
export const voteWeight = (previous: number, next: VoteDirection): number =>
  next - previous;

/**
 * When a track plays, its owner earns the crowd's net verdict — the track's
 * score (up minus down votes) at the moment it plays. A track nobody voted on
 * pays 0; a well-liked one pays its score.
 */
export const playReward = (trackScore: number): number => trackScore;
