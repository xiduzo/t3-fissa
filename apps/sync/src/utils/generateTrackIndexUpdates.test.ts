import { describe, expect, test } from "vitest";
import { TrackBuilder } from "@fissa/test";

import { generateTrackIndexUpdates } from "./generateTrackIndexUpdates";

describe(generateTrackIndexUpdates.name, () => {
  describe("only sorting from below the current index", () => {
    test("should sort positive votes below the current index", () => {
      const tracks = [
        new TrackBuilder("0").withIndex(0).build(),
        new TrackBuilder("1").withIndex(1).build(),
        new TrackBuilder("2").withIndex(2).build(),
        new TrackBuilder("3").withIndex(3).build(),
        new TrackBuilder("4").withIndex(4).build(),
        new TrackBuilder("5").withIndex(5).withScore(1).build(),
      ];

      const { updateMany } = generateTrackIndexUpdates(tracks, 1);

      expect(updateMany).toMatchObject([
        { where: { trackId: "5" }, data: { index: 2 } },
        { where: { trackId: "2" }, data: { index: 3 } },
        { where: { trackId: "3" }, data: { index: 4 } },
        { where: { trackId: "4" }, data: { index: 5 } },
      ]);
    });

    test("should sort negative tracks to the bottom", () => {
      const tracks = [
        new TrackBuilder("0").withIndex(0).build(),
        new TrackBuilder("1").withIndex(1).build(),
        new TrackBuilder("2").withIndex(2).withScore(-1).build(),
        new TrackBuilder("3").withIndex(3).build(),
        new TrackBuilder("4").withIndex(4).build(),
        new TrackBuilder("5").withIndex(5).build(),
      ];

      const { updateMany } = generateTrackIndexUpdates(tracks, 1);

      expect(updateMany).toMatchObject([
        { where: { trackId: "3" }, data: { index: 2 } },
        { where: { trackId: "4" }, data: { index: 3 } },
        { where: { trackId: "5" }, data: { index: 4 } },
        { where: { trackId: "2" }, data: { index: 5 } },
      ]);
    });

    test("should sort both positive and negative tracks", () => {
      const tracks = [
        new TrackBuilder("0").withIndex(0).build(),
        new TrackBuilder("1").withIndex(1).withScore(-2).build(),
        new TrackBuilder("2").withIndex(2).withScore(-1).build(),
        new TrackBuilder("3").withIndex(3).withScore(2).build(),
        new TrackBuilder("4").withIndex(4).build(),
        new TrackBuilder("5").withIndex(5).withScore(1).build(),
      ];

      const { updateMany } = generateTrackIndexUpdates(tracks, 0);

      expect(updateMany).toMatchObject([
        { where: { trackId: "3" }, data: { index: 1 } },
        { where: { trackId: "5" }, data: { index: 2 } },
        { where: { trackId: "4" }, data: { index: 3 } },
        { where: { trackId: "2" }, data: { index: 4 } },
        { where: { trackId: "1" }, data: { index: 5 } },
      ]);
    });
  });

  describe("sorting from above the current index", () => {
    test("should update the current index", () => {
      const tracks = [
        new TrackBuilder("0").withIndex(0).build(),
        new TrackBuilder("1").withIndex(1).withScore(2).build(),
        new TrackBuilder("2").withIndex(2).build(),
        new TrackBuilder("3").withIndex(3).build(),
        new TrackBuilder("4").withIndex(4).build(),
        new TrackBuilder("5").withIndex(5).build(),
      ];

      const { newCurrentIndex } = generateTrackIndexUpdates(tracks, 2);

      expect(newCurrentIndex).toBe(1);
    });

    test("should update the tracks below the new current index", () => {
      const tracks = [
        new TrackBuilder("0").withIndex(0).build(),
        new TrackBuilder("1").withIndex(1).withScore(2).build(),
        new TrackBuilder("2").withIndex(2).withScore(1).build(),
        new TrackBuilder("3").withIndex(3).withScore(3).build(),
        new TrackBuilder("4").withIndex(4).withScore(1).build(),
        new TrackBuilder("5").withIndex(5).build(),
        new TrackBuilder("6").withIndex(6).build(),
        new TrackBuilder("7").withIndex(7).withScore(-1).build(),
        new TrackBuilder("8").withIndex(8).build(),
        new TrackBuilder("9").withIndex(9).build(),
      ];

      const { updateMany } = generateTrackIndexUpdates(tracks, 6);

      expect(updateMany).toMatchObject([
        { where: { trackId: "5" }, data: { index: 1 } },
        { where: { trackId: "6" }, data: { index: 2 } },
        { where: { trackId: "1" }, data: { index: 4 } },
        { where: { trackId: "2" }, data: { index: 5 } },
        { where: { trackId: "4" }, data: { index: 6 } },
        { where: { trackId: "8" }, data: { index: 7 } },
        { where: { trackId: "9" }, data: { index: 8 } },
        { where: { trackId: "7" }, data: { index: 9 } },
      ]);
    });
  });
});
