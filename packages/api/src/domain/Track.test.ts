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

    it("re-queues the track: not reset, not played, votes kept", () => {
      const { resetScore, hasBeenPlayed, clearVotes } = track(0).castVote({
        voterId: VOTER,
        direction: 1,
        previousVote: 0,
      });
      expect(resetScore).toBe(false);
      expect(hasBeenPlayed).toBe(false);
      expect(clearVotes).toBe(false);
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
    it("rewards the owner the track's net score and resets the score", () => {
      const t = track(4);
      const { events, resetScore, totalScoreDelta } = t.play();
      expect(awarded(events)).toHaveLength(1);
      expect(awarded(events)[0]).toMatchObject({ userId: OWNER, amount: 4, reason: "playReward" });
      expect(resetScore).toBe(true);
      expect(totalScoreDelta).toBe(0); // totalScore is lifetime; play never touches it
      expect(t.score).toBe(0);
    });

    it("marks the track played and clears its votes", () => {
      const { hasBeenPlayed, clearVotes } = track(4).play();
      expect(hasBeenPlayed).toBe(true);
      expect(clearVotes).toBe(true);
    });

    it("pays nothing for a track nobody voted on", () => {
      expect(awarded(track(0).play().events)).toHaveLength(0);
    });

    it("pays nothing for an owner-less (recommended) track", () => {
      expect(awarded(track(5, null).play().events)).toHaveLength(0);
    });
  });

  describe("skip", () => {
    it("penalises the owner and drops the track's lifetime totalScore", () => {
      const t = track(3);
      const { events, resetScore, totalScoreDelta } = t.skip();
      expect(awarded(events)).toHaveLength(1);
      expect(awarded(events)[0]).toMatchObject({ userId: OWNER, amount: -5, reason: "skipPenalty" });
      expect(totalScoreDelta).toBe(-5);
      expect(resetScore).toBe(true);
      expect(t.score).toBe(0);
    });

    it("marks the track played so it drops out of the queue, but keeps its votes", () => {
      const { hasBeenPlayed, clearVotes } = track(3).skip();
      expect(hasBeenPlayed).toBe(true);
      expect(clearVotes).toBe(false);
    });

    it("still drops totalScore but raises nothing for an owner-less track", () => {
      const { events, totalScoreDelta } = track(2, null).skip();
      expect(awarded(events)).toHaveLength(0);
      expect(totalScoreDelta).toBe(-5);
    });
  });
});
