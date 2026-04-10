import type { Track } from "@fissa/db";

export type InsertTrackInput = {
  trackId: string;
  durationMs: number;
  userId?: string | null;
  pin: string;
};

export interface ITrackRepository {
  findByPin(pin: string): Promise<Track[]>;

  insertMany(input: InsertTrackInput[]): Promise<void>;

  delete(pin: string, trackId: string): Promise<void>;
}
