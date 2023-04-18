import { differenceInSeconds } from "@fissa/utils";

import { api } from "../utils/api";
import { generateTrackIndexUpdates } from "../utils/generateTrackIndexUpdates";

const isUpdating = new Map<string, boolean>();

export const reorderPlaylistSync = async () => {
  const fissas = await api.fissa.sync.active.query();

  for (const fissa of fissas) {
    if (!fissa.shouldReorder) continue;
    if (isUpdating.get(fissa.pin)) continue;

    try {
      isUpdating.set(fissa.pin, true);
      console.log(`[${fissa.pin}] reordering playlist`);

      if (differenceInSeconds(fissa.expectedEndTime, new Date()) < 5) continue;

      const { updates, newCurrentIndex } = generateTrackIndexUpdates(
        fissa.tracks,
        // fissa.currentIndex,
        1, // TODO: do we need this?
      );

      if (!updates.length) {
        console.info(`[${fissa.pin}] no updates needed`);
        continue;
      }

      await api.fissa.sync.reorder.mutate({
        pin: fissa.pin,
        updates,
        newCurrentIndex,
      });

      console.log(`[${fissa.pin}] reordering done`);
    } catch (error) {
      console.error(`[${fissa.pin}] reordering failed`, error);
    } finally {
      isUpdating.delete(fissa.pin);
    }
  }
};
