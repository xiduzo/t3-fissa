/**
 * Fissa aggregate — the live listening party rooted at `pin` (CONTEXT.md): its
 * owner and the lifecycle of the `currentlyPlaying` pointer. It owns the rules,
 * not the writes: each owner-only command validates the transition and returns
 * a {@link FissaOutcome} naming what Playback must do. Playback stays the sole
 * writer of the pointer row — it alone knows what plays next and when. The
 * aggregate is pure: no DB, no Spotify.
 */

import { FissaIsPaused, NotTheHost } from "@fissa/utils";

import { fissaCreated, memberJoined, type DomainEvent } from "./events";

/** What Playback must do once a Fissa command is accepted. */
export type FissaAction = "advance" | "stop" | "none";

/** The transition a Fissa command represents, plus the events it raised. */
export interface FissaOutcome {
  readonly action: FissaAction;
  readonly events: DomainEvent[];
}

export class Fissa {
  constructor(
    readonly pin: string,
    private readonly ownerId: string,
    /** The track the party is on, or null when paused. */
    private readonly currentlyPlayingId: string | null,
  ) {}

  /** The owner-only gate every host command crosses first. */
  private requireHost(userId: string): void {
    if (this.ownerId !== userId) throw new NotTheHost();
  }

  /**
   * A guest joins the party and raises `MemberJoined`. The host never "joins"
   * their own Fissa, so they raise nothing.
   */
  join(userId: string): FissaOutcome {
    const events: DomainEvent[] =
      userId !== this.ownerId ? [memberJoined({ pin: this.pin, userId })] : [];
    return { action: "none", events };
  }

  /**
   * Host skips the playing track — only valid while a track is playing; a
   * paused party has nothing to skip. The skipped track's penalty rides the
   * Track aggregate, not this one.
   */
  skip(userId: string): FissaOutcome {
    this.requireHost(userId);
    if (!this.currentlyPlayingId) throw new FissaIsPaused();
    return { action: "advance", events: [] };
  }

  /** Host restarts playback: re-advance the pointer to the top of the queue. */
  restart(userId: string): FissaOutcome {
    this.requireHost(userId);
    return { action: "advance", events: [] };
  }

  /** Host pauses: clear the pointer and stop the player. */
  pause(userId: string): FissaOutcome {
    this.requireHost(userId);
    return { action: "stop", events: [] };
  }

  /** The event raised when a party is first created. */
  static created(pin: string, ownerId: string): DomainEvent {
    return fissaCreated({ pin, userId: ownerId });
  }
}
