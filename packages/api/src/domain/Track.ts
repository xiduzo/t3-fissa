/**
 * Track aggregate — a queued song rooted at `(pin, trackId)`, owning its score
 * and every points-earning rule that turns on a track: the vote-received
 * credit, the play reward, and the skip penalty (ADR-0001). A vote locks one
 * Track, never the whole party.
 *
 * Each command mutates the in-memory score and returns a {@link TrackOutcome}
 * describing how the persisted row should move plus the domain events to raise.
 * The owner's reward/penalty is *not* applied here — it rides a `PointsAwarded`
 * event the Wallet folds later (earning is eventual).
 */

import {
  pointsAwarded,
  voteCast,
  type DomainEvent,
  type VoteDirection,
} from "./events";
import { playReward, SKIP_PENALTY, voteWeight } from "./pointsPolicy";

export interface CastVoteCommand {
  readonly voterId: string;
  readonly direction: VoteDirection;
  /** The voter's previous vote on this track, or 0 if none. */
  readonly previousVote: number;
}

/**
 * How a Track command moves the persisted row and what it raises — the same
 * shape across vote, play, and skip. A single applier
 * ({@link ITrackRepository.applyOutcome}) consumes it: it moves the row and
 * appends `events` to the outbox in one transaction. No caller hand-maps these
 * fields; that divergence is exactly what the shared applier removes.
 */
export interface TrackOutcome {
  /** Additive change to the persisted score. Ignored when `resetScore`. */
  readonly scoreDelta: number;
  /** Set the persisted score to 0 — a track that just played or was skipped. */
  readonly resetScore: boolean;
  /** Additive change to the persisted totalScore (lifetime net; never reset). */
  readonly totalScoreDelta: number;
  /**
   * The persisted `hasBeenPlayed` flag, or `undefined` to leave it untouched.
   * A vote re-queues the track (`false`); a play and a skip both mark it done
   * (`true`), dropping it out of the upcoming ordering.
   */
  readonly hasBeenPlayed?: boolean;
  /** Delete every vote on the track — its votes don't outlive the play. */
  readonly clearVotes: boolean;
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
   * Cast or re-cast a vote. Applies the re-vote delta to both score and
   * totalScore and emits `VoteCast`, plus `PointsAwarded` to the owner — unless
   * the voter *is* the owner, who never earns from their own votes.
   */
  castVote({ voterId, direction, previousVote }: CastVoteCommand): TrackOutcome {
    const scoreDelta = voteWeight(previousVote, direction);
    this._score += scoreDelta;

    const events: DomainEvent[] = [
      voteCast({ pin: this.pin, byUser: voterId, forUser: this.ownerId, direction }),
    ];

    if (this.ownerId && this.ownerId !== voterId && scoreDelta !== 0) {
      events.push(this.award(scoreDelta, "voteReceived"));
    }

    return {
      scoreDelta,
      resetScore: false,
      totalScoreDelta: scoreDelta,
      hasBeenPlayed: false,
      clearVotes: false,
      events,
    };
  }

  /**
   * The track is selected to play: its owner earns the crowd's net verdict
   * (the score at this moment). The score resets to 0; totalScore is the
   * lifetime figure and stays put. Pays nothing for an owner-less or
   * unvoted track.
   */
  play(): TrackOutcome {
    const award = playReward(this._score);
    const events = this.ownerId && award !== 0 ? [this.award(award, "playReward")] : [];
    this._score = 0;
    return {
      scoreDelta: 0,
      resetScore: true,
      totalScoreDelta: 0,
      hasBeenPlayed: true,
      clearVotes: true,
      events,
    };
  }

  /**
   * The host skips the track: its owner takes a flat penalty and the track's
   * lifetime totalScore drops by the same amount. The current score resets to 0
   * and the track is marked played so it leaves the upcoming ordering.
   */
  skip(): TrackOutcome {
    const events = this.ownerId ? [this.award(SKIP_PENALTY, "skipPenalty")] : [];
    this._score = 0;
    return {
      scoreDelta: 0,
      resetScore: true,
      totalScoreDelta: SKIP_PENALTY,
      // A skipped track drops out of the upcoming ordering, same as a played one.
      hasBeenPlayed: true,
      clearVotes: false,
      events,
    };
  }

  private award(amount: number, reason: "voteReceived" | "playReward" | "skipPenalty") {
    return pointsAwarded({ pin: this.pin, userId: this.ownerId!, amount, reason });
  }
}
