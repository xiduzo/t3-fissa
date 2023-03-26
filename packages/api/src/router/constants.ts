import { z } from "zod";

export const Z_TRACK_ID = z.string().length(22);
export const Z_PIN = z.string().length(4);
export const Z_TRACKS = z
  .array(
    z.object({
      trackId: Z_TRACK_ID,
      durationMs: z.number(),
    }),
  )
  .min(1);
