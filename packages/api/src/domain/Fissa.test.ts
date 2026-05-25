import { FissaIsPaused, NotTheHost } from "@fissa/utils";
import { describe, expect, it } from "vitest";

import type { MemberJoined } from "./events";
import { Fissa } from "./Fissa";

describe("Fissa", () => {
  const OWNER = "owner-1";
  const GUEST = "guest-2";
  const fissa = (currentlyPlayingId: string | null = "track-1") =>
    new Fissa("AB12", OWNER, currentlyPlayingId);

  describe("join", () => {
    it("raises MemberJoined for a guest", () => {
      const { action, events } = fissa().join(GUEST);
      expect(action).toBe("none");
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject<Partial<MemberJoined>>({
        type: "MemberJoined",
        pin: "AB12",
        userId: GUEST,
      });
    });

    it("raises nothing when the host 'joins' their own party", () => {
      const { events } = fissa().join(OWNER);
      expect(events).toHaveLength(0);
    });
  });

  describe("skip", () => {
    it("advances when the host skips a playing track", () => {
      const { action, events } = fissa("track-1").skip(OWNER);
      expect(action).toBe("advance");
      expect(events).toHaveLength(0); // the penalty rides the Track aggregate
    });

    it("rejects a non-host", () => {
      expect(() => fissa().skip(GUEST)).toThrow(NotTheHost);
    });

    it("rejects a skip on a paused party", () => {
      expect(() => fissa(null).skip(OWNER)).toThrow(FissaIsPaused);
    });
  });

  describe("restart", () => {
    it("advances for the host, even while paused", () => {
      expect(fissa(null).restart(OWNER).action).toBe("advance");
    });

    it("rejects a non-host", () => {
      expect(() => fissa().restart(GUEST)).toThrow(NotTheHost);
    });
  });

  describe("pause", () => {
    it("stops for the host", () => {
      expect(fissa().pause(OWNER).action).toBe("stop");
    });

    it("rejects a non-host", () => {
      expect(() => fissa().pause(GUEST)).toThrow(NotTheHost);
    });
  });
});
