/**
 * Track aggregate — a queued song rooted at `(pin, trackId)`, owning its score
 * and the voting invariants. A vote locks one Track, never the whole party
 * (ADR-0001).
 *
 * Commands mutate the in-memory score and return the resulting domain events;
 * the owner's reward is *not* applied here — it rides a `PointsAwarded` event
 * that the Wallet folds later (earning is eventual).
 */

import {
  pointsAwarded,
  voteCast,
  type DomainEvent,
  type VoteDirection,
} from "./events";
import { playReward, voteWeight } from "./pointsPolicy";

export interface CastVoteCommand {
  readonly voterId: string;
  readonly direction: VoteDirection;
  /** The voter's previous vote on this track, or 0 if none. */
  readonly previousVote: number;
}

export interface VoteOutcome {
  /** The change to apply to the track's persisted score. */
  readonly scoreDelta: number;
  readonly events: DomainEvent[];
}

export class Track {
  constructor(
    readonly pin: string,
    readonly trackId: string,
    /** The guest who queued the track; null for recommended tracks. */
    readonly ownerId: string | null,
    private _score: number,
  ) {}

  get score(): number {
    return this._score;
  }

  /**
   * Cast or re-cast a vote. Applies the re-vote delta and emits `VoteCast`,
   * plus `PointsAwarded` to the owner — unless the voter *is* the owner, who
   * never earns from their own votes.
   */
  castVote({ voterId, direction, previousVote }: CastVoteCommand): VoteOutcome {
    const scoreDelta = voteWeight(previousVote, direction);
    this._score += scoreDelta;

    const events: DomainEvent[] = [
      voteCast({ pin: this.pin, byUser: voterId, forUser: this.ownerId, direction }),
    ];

    if (this.ownerId && this.ownerId !== voterId && scoreDelta !== 0) {
      events.push(
        pointsAwarded({
          pin: this.pin,
          userId: this.ownerId,
          amount: scoreDelta,
          reason: "voteReceived",
        }),
      );
    }

    return { scoreDelta, events };
  }

  /**
   * The track is selected to play: its owner earns the crowd's net verdict.
   * Returns the reward events (empty when the track has no owner or earned
   * nothing). The caller resets the score and clears votes when persisting.
   */
  play(): DomainEvent[] {
    const award = playReward(this._score);
    if (!this.ownerId || award === 0) return [];
    return [
      pointsAwarded({
        pin: this.pin,
        userId: this.ownerId,
        amount: award,
        reason: "playReward",
      }),
    ];
  }
}
