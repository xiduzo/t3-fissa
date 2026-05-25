import { describe, expect, it } from "vitest";

import type { PointsAwarded } from "./events";
import { Track } from "./Track";

describe("Track", () => {
  const OWNER = "owner-1";
  const VOTER = "voter-2";
  const track = (score = 0, ownerId: string | null = OWNER) =>
    new Track("AB12", "track-xyz", ownerId, score);

  const awarded = (events: { type: string }[]) =>
    events.filter((e): e is PointsAwarded => e.type === "PointsAwarded");

  describe("castVote", () => {
    it("applies a first upvote as +1 and rewards the owner", () => {
      const t = track(0);
      const { scoreDelta, events } = t.castVote({
        voterId: VOTER,
        direction: 1,
        previousVote: 0,
      });

      expect(scoreDelta).toBe(1);
      expect(t.score).toBe(1);
      expect(awarded(events)).toHaveLength(1);
      expect(awarded(events)[0]).toMatchObject({ userId: OWNER, amount: 1, reason: "voteReceived" });
    });

    it("re-casting from up to down moves the score by the delta, not by the raw vote", () => {
      const t = track(1);
      const { scoreDelta } = t.castVote({ voterId: VOTER, direction: -1, previousVote: 1 });

      // delta = -1 - 1 = -2, never double-counted
      expect(scoreDelta).toBe(-2);
      expect(t.score).toBe(-1);
    });

    it("never rewards a guest for voting on their own track", () => {
      const t = track(0);
      const { scoreDelta, events } = t.castVote({
        voterId: OWNER,
        direction: 1,
        previousVote: 0,
      });

      expect(scoreDelta).toBe(1);
      expect(t.score).toBe(1);
      expect(awarded(events)).toHaveLength(0);
    });

    it("always emits a VoteCast event", () => {
      const t = track(0);
      const { events } = t.castVote({ voterId: VOTER, direction: 1, previousVote: 0 });
      expect(events.some((e) => e.type === "VoteCast")).toBe(true);
    });
  });

  describe("play", () => {
    it("rewards the owner the track's net score", () => {
      const events = track(4).play();
      expect(awarded(events)).toHaveLength(1);
      expect(awarded(events)[0]).toMatchObject({ userId: OWNER, amount: 4, reason: "playReward" });
    });

    it("pays nothing for a track nobody voted on", () => {
      expect(track(0).play()).toHaveLength(0);
    });

    it("pays nothing for an owner-less (recommended) track", () => {
      expect(track(5, null).play()).toHaveLength(0);
    });
  });
});
