import { prisma } from "@fissa/db";
import { Timer, differenceInSeconds } from "@fissa/utils";

import { api } from "../utils/api";
import { generateTrackIndexUpdates } from "../utils/generateTrackIndexUpdates";

const isUpdating = new Map<string, boolean>();

export const reorderPlaylistSync = async () => {
  const fissas = await api.fissa.sync.active.query();

  for (const fissa of fissas) {
    if (!fissa.shouldReorder) return;
    if (isUpdating.get(fissa.pin)) return;

    try {
      isUpdating.set(fissa.pin, true);
      console.log(`reordering playlist for ${fissa.pin}...`);
      await reorderTracksFromPlaylist(fissa.pin);
      console.log(`reordering done for ${fissa.pin}`);
    } catch (error) {
      console.error(`reordering failed for ${fissa.pin}`, error);
    } finally {
      isUpdating.set(fissa.pin, false);
    }
  }
};

const reorderTracksFromPlaylist = async (pin: string) => {
  const { tracks, currentIndex, expectedEndTime } =
    await prisma.fissa.findUniqueOrThrow({
      where: { pin },
      select: { tracks: true, currentIndex: true, expectedEndTime: true },
    });

  // Don't reorder in the last X seconds of the current track
  // To prevent f*cking up the order with the currentlyPlayingSync
  if (differenceInSeconds(expectedEndTime, new Date()) < 5) return;

  const { updateMany, fakeUpdates, newCurrentIndex } =
    generateTrackIndexUpdates(tracks, currentIndex);

  if (!updateMany.length) {
    console.info(`No updates needed for fissa ${pin}`);
    return;
  }

  const timer = new Timer(
    `Reordering ${updateMany.length} tracks for fissa ${pin}`,
  );

  await prisma.$transaction(
    async (transaction) => {
      // (1) Clear out the indexes
      await transaction.fissa.update({
        where: { pin },
        data: { tracks: { updateMany: fakeUpdates } },
      });

      // (2) Set the correct indexes
      await transaction.fissa.update({
        where: { pin },
        data: {
          tracks: { updateMany },
          currentIndex: newCurrentIndex,
          lastPlayedIndex: newCurrentIndex,
          shouldReorder: false,
        },
      });
    },
    {
      maxWait: 20 * 1000,
      timeout: 60 * 1000,
    },
  );

  timer.duration();
};
