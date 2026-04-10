import { tracks, type DB, type Track } from "@fissa/db";
import { and, eq } from "drizzle-orm";

import type { ITrackRepository, InsertTrackInput } from "../interfaces";

export class TrackRepository implements ITrackRepository {
  constructor(private readonly db: DB) {}

  findByPin = async (pin: string): Promise<Track[]> => {
    return this.db.query.tracks.findMany({
      where: eq(tracks.pin, pin),
    });
  };

  insertMany = async (input: InsertTrackInput[]): Promise<void> => {
    if (!input.length) return;
    await this.db.insert(tracks).values(input).onConflictDoNothing();
  };

  delete = async (pin: string, trackId: string): Promise<void> => {
    await this.db
      .delete(tracks)
      .where(and(eq(tracks.pin, pin), eq(tracks.trackId, trackId)));
  };
}
