import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DB } from "@fissa/db";
import { mock } from "@fissa/test";

import { Track } from "../domain/Track";
import type { OutboxRepository } from "./OutboxRepository";
import { TrackRepository } from "./TrackRepository";

/**
 * applyOutcome is the single place a Track command's outcome becomes
 * persistence (ADR-0001). These cover the row mapping that used to diverge
 * across VoteService, PlaybackService, and FissaService: the score reset vs.
 * delta, the conditional hasBeenPlayed, the vote clear, and the outbox append.
 */
describe("TrackRepository.applyOutcome", () => {
  const outbox = mock<OutboxRepository>();
  const db = mock<DB>();

  // A throwaway tx that records the .set() payload and resolves the chain.
  let setArg: Record<string, unknown>;
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn((arg: Record<string, unknown>) => {
    setArg = arg;
    return { where };
  });
  const deleteWhere = vi.fn().mockResolvedValue(undefined);
  const tx = {
    update: vi.fn(() => ({ set })),
    delete: vi.fn(() => ({ where: deleteWhere })),
  } as unknown as Parameters<Parameters<DB["transaction"]>[0]>[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const repo = () => new TrackRepository(db, outbox);
  const track = (score: number, ownerId: string | null = "owner-1") =>
    new Track("AB12", "track-xyz", ownerId, score);

  it("applies a vote as a delta, re-queues the track, keeps its votes", async () => {
    const t = track(0);
    const outcome = t.castVote({ voterId: "voter-2", direction: 1, previousVote: 0 });

    await repo().applyOutcome(t, outcome, tx);

    expect(setArg.score).not.toBe(0); // additive, not a reset
    expect(setArg.hasBeenPlayed).toBe(false);
    expect(tx.delete).not.toHaveBeenCalled();
    expect(outbox.append).toHaveBeenCalledWith(outcome.events, tx);
  });

  it("on play: resets score, marks played, clears votes, appends the reward", async () => {
    const t = track(4);
    const outcome = t.play();

    await repo().applyOutcome(t, outcome, tx);

    expect(setArg.score).toBe(0);
    expect(setArg.hasBeenPlayed).toBe(true);
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(outbox.append).toHaveBeenCalledWith(outcome.events, tx);
  });

  it("on skip: resets score, marks played so it leaves the queue, but keeps votes", async () => {
    const t = track(3);
    const outcome = t.skip();

    await repo().applyOutcome(t, outcome, tx);

    expect(setArg.score).toBe(0);
    expect(setArg.hasBeenPlayed).toBe(true);
    expect(tx.delete).not.toHaveBeenCalled(); // votes survive the skip
    expect(outbox.append).toHaveBeenCalledWith(outcome.events, tx);
  });
});
