import { Track } from "@fissa/db";

import { Builder } from "./Builder";

export class TrackBuilder extends Builder<Track> {
  constructor(id?: string) {
    super({
      trackId: id ?? "1",
      durationMs: 0,
      index: 0,
      pin: "1111",
      score: 0,
    });
  }

  withIndex(index: number) {
    this._data.index = index;
    return this;
  }

  withScore(score: number) {
    this._data.score = score;
    return this;
  }
}
