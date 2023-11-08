import { describe, expect, it } from "vitest";
import { fromPartial } from "@fissa/test";

import { sortFissaTracksOrder, splitInChunks, type SortableTrack } from "./array";

describe(sortFissaTracksOrder.name, () => {
  const PLAYED_TRACK = fromPartial<SortableTrack>({
    trackId: "1",
    hasBeenPlayed: true,
    lastUpdateAt: new Date("2023-09-14T08:00:00"),
    score: 0,
  });

  const NON_PLAYED_TRACK = fromPartial<SortableTrack>({
    trackId: "2",
    hasBeenPlayed: false,
    createdAt: new Date("2023-09-14T09:00:00"),
    score: 100,
  });

  const NON_PLAYED_TRACK_LOW_SCORE = fromPartial<SortableTrack>({
    trackId: "3",
    hasBeenPlayed: false,
    createdAt: new Date("2023-09-14T09:00:00"),
    score: 10,
  });

  const NON_PLATED_TRACK_NEGATIVE_SCORE = fromPartial<SortableTrack>({
    trackId: "4",
    hasBeenPlayed: false,
    createdAt: new Date("2023-09-14T09:00:00"),
    score: -10,
  });

  it("should sort tracks correctly when tracks array is provided", () => {
    const sampleTracks = [
      NON_PLATED_TRACK_NEGATIVE_SCORE,
      NON_PLAYED_TRACK_LOW_SCORE,
      PLAYED_TRACK,
      NON_PLAYED_TRACK,
    ];
    const expectedSortedOrder = [
      PLAYED_TRACK,
      NON_PLAYED_TRACK,
      NON_PLAYED_TRACK_LOW_SCORE,
      NON_PLATED_TRACK_NEGATIVE_SCORE,
    ];

    const sortedTracks = sortFissaTracksOrder(sampleTracks);

    expect(sortedTracks).toStrictEqual(expectedSortedOrder);
  });

  it("should return an empty array when tracks are not provided", () => {
    const sortedTracks = sortFissaTracksOrder(undefined);
    expect(sortedTracks).toStrictEqual([]);
  });

  it("should sort the active track right after the played tracks", () => {
    const activeTrack = fromPartial<SortableTrack>({
      trackId: "activeTrackId",
      hasBeenPlayed: false,
      createdAt: new Date("2023-09-14T09:00:00"),
      score: -10,
    });

    const sampleTracks = [
      PLAYED_TRACK,
      NON_PLAYED_TRACK_LOW_SCORE,
      NON_PLAYED_TRACK,
      activeTrack,
      NON_PLATED_TRACK_NEGATIVE_SCORE,
    ];

    const expectedSortedOrder = [
      PLAYED_TRACK,
      activeTrack,
      NON_PLAYED_TRACK,
      NON_PLAYED_TRACK_LOW_SCORE,
      NON_PLATED_TRACK_NEGATIVE_SCORE,
    ];

    const sortedTracks = sortFissaTracksOrder(sampleTracks, activeTrack.trackId);

    expect(sortedTracks).toStrictEqual(expectedSortedOrder);
  });
});

describe(splitInChunks.name, () => {
  it("should split an array into chunks of the specified size", () => {
    const inputArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const chunkSize = 3;

    const result = splitInChunks(inputArray, chunkSize);

    expect(result).toStrictEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
  });

  it("should handle an empty array", () => {
    const inputArray: number[] = [];
    const chunkSize = 5;

    const result = splitInChunks(inputArray, chunkSize);

    expect(result).toStrictEqual([]);
  });

  it("should handle a chunk size larger than the array length", () => {
    const inputArray = [1, 2, 3];
    const chunkSize = 5;

    const result = splitInChunks(inputArray, chunkSize);

    expect(result).toStrictEqual([[1, 2, 3]]);
  });
});
