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

/**
 * addTracks owns one transactional intent: insert rows, record the guest's
 * self-vote, bump score, and emit `TrackAdded` — in one transaction so a crash
 * mid-way cannot leave tracks queued with no event (and vice versa). The fold
 * (PointsAwarded for the self-vote) is intentionally skipped — a guest never
 * earns from their own vote (ADR-0001).
 */
describe("TrackRepository.addTracks", () => {
  const outbox = mock<OutboxRepository>();
  const db = mock<DB>();

  const txInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    }),
  });
  const txInsertVotes = vi.fn().mockResolvedValue(undefined);
  const txDelete = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });
  const txUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // tracks insert chain uses onConflictDoNothing; votes insert chain just .values
    txInsert.mockReturnValue({
      values: vi.fn().mockImplementation(() => ({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        // .values() also resolves directly for the votes insert
        then: (resolve: () => void) => Promise.resolve().then(resolve),
      })),
    });
    const txObj = {
      insert: txInsert,
      delete: txDelete,
      update: txUpdate,
    } as never;
    db.transaction.mockImplementation((cb: (t: never) => unknown) =>
      Promise.resolve(cb(txObj)),
    );
  });

  const repo = () => new TrackRepository(db, outbox);

  it("returns early on empty input — no transaction, no event", async () => {
    await repo().addTracks("AB12", [], "user-1");

    expect(db.transaction).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it("emits a single TrackAdded event with pin + userId + count", async () => {
    await repo().addTracks(
      "AB12",
      [
        { trackId: "t1".padEnd(22, "x"), durationMs: 1000 },
        { trackId: "t2".padEnd(22, "x"), durationMs: 2000 },
      ],
      "user-1",
    );

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(outbox.append).toHaveBeenCalledTimes(1);
    const [events, txArg] = outbox.append.mock.calls[0]!;
    expect(txArg).toBeDefined();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "TrackAdded",
      pin: "AB12",
      userId: "user-1",
      count: 2,
    });
  });
});
