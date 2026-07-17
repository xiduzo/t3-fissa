import { addMilliseconds } from "@fissa/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EndOfTrackTimer, type EndOfTrackCaller } from "./EndOfTrackTimer";

/**
 * The end-of-track timer's halving algorithm is the only novel piece of the
 * sync orchestrator. These pin it down with a fake clock so future tweaks
 * don't drift the schedule without us noticing.
 */
describe("EndOfTrackTimer", () => {
  const NOW = new Date("2026-05-28T10:00:00Z");

  let caller: { playNextTrack: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    caller = { playNextTrack: vi.fn().mockResolvedValue(null) };
  });

  const timer = () => new EndOfTrackTimer(caller as unknown as EndOfTrackCaller);

  it("with plenty of time left, schedules a check at delay/2 (minus the wiggle)", () => {
    const t = timer();
    // Track ends in 60s; wiggle 5s -> effective endTime is +55s; halve = 27.5s
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 60_000) });

    expect(caller.playNextTrack).not.toHaveBeenCalled();
    expect(t.isArmed("AB12")).toBe(true);

    vi.advanceTimersByTime(27_500);
    expect(caller.playNextTrack).not.toHaveBeenCalled(); // re-armed at next half
  });

  it("when within MIN_CHECK_DELAY_MS of end-of-track, calls playNextTrack immediately", async () => {
    const t = timer();
    // 5s wiggle eats the whole 5s remaining → delay ≤ 0 → fires now
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 5_000) });

    expect(caller.playNextTrack).toHaveBeenCalledWith("AB12");
    expect(t.isArmed("AB12")).toBe(false);
    await vi.runAllTimersAsync(); // drain microtasks
  });

  it("re-arming the same pin clears the prior timer (no double schedule)", () => {
    const t = timer();
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 60_000) });
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 120_000) });

    expect(t.isArmed("AB12")).toBe(true);
    // Only one pending timer survives; firing the first delay shouldn't fire playNextTrack
    vi.advanceTimersByTime(30_000);
    expect(caller.playNextTrack).not.toHaveBeenCalled();
  });

  it("after firing playNextTrack, re-arms on the returned expectedEndTime", async () => {
    caller.playNextTrack.mockResolvedValueOnce(addMilliseconds(NOW, 30_000));
    const t = timer();

    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 5_000) });
    // Flush the playNextTrack promise's microtask so .then re-arms — without
    // advancing time, so the new timer is still pending and observable.
    await vi.advanceTimersByTimeAsync(0);

    expect(caller.playNextTrack).toHaveBeenCalledTimes(1);
    expect(t.isArmed("AB12")).toBe(true);
  });

  it("does not re-arm when playNextTrack resolves null (queue empty)", async () => {
    caller.playNextTrack.mockResolvedValueOnce(null);
    const t = timer();

    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 5_000) });
    await vi.runAllTimersAsync();

    expect(t.isArmed("AB12")).toBe(false);
  });

  it("a re-arm while playNextTrack is in flight wins over the stale async re-arm", async () => {
    let resolvePlay!: (d: Date | null) => void;
    caller.playNextTrack.mockReturnValueOnce(new Promise((r) => (resolvePlay = r)));
    const t = timer();

    // Track is ending — the timer fires playNextTrack.
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 5_000) });
    expect(caller.playNextTrack).toHaveBeenCalledTimes(1);

    // While the advance is in flight, a skip re-arms with the real new end time.
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 300_000) });

    // The in-flight advance resolves late with a now-stale end time — its
    // re-arm must NOT overwrite the newer schedule.
    resolvePlay(addMilliseconds(NOW, 30_000));
    await vi.advanceTimersByTimeAsync(0);

    // Past the stale end time nothing fires; the newer schedule stands.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(caller.playNextTrack).toHaveBeenCalledTimes(1);
    expect(t.isArmed("AB12")).toBe(true);
  });

  it("a halving step from a superseded generation dies instead of resurrecting its end time", async () => {
    const t = timer();
    // Old chain halving toward +60s (fires timeouts at 27.5s, ...).
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 60_000) });
    // Restart pushes the end far out; the old chain is now stale.
    t.arm({ pin: "AB12", expectedEndTime: addMilliseconds(NOW, 600_000) });

    // Run well past the old end time: the stale chain must never fire.
    await vi.advanceTimersByTimeAsync(120_000);
    expect(caller.playNextTrack).not.toHaveBeenCalled();
    expect(t.isArmed("AB12")).toBe(true);
  });

  it("cancelAll drops every pending timer", () => {
    const t = timer();
    t.arm({ pin: "AA00", expectedEndTime: addMilliseconds(NOW, 60_000) });
    t.arm({ pin: "BB11", expectedEndTime: addMilliseconds(NOW, 90_000) });

    t.cancelAll();

    expect(t.isArmed("AA00")).toBe(false);
    expect(t.isArmed("BB11")).toBe(false);
    vi.advanceTimersByTime(120_000);
    expect(caller.playNextTrack).not.toHaveBeenCalled();
  });
});
