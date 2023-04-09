import { Track, prisma } from "@fissa/db";
import { Timer } from "@fissa/utils";

import { api } from "../utils/api";

export const reorderPlaylistSync = async () => {
  const fissas = await api.fissa.sync.active.query();

  for (const fissa of fissas) {
    if (!fissa.shouldReorder) return;

    try {
      console.log(`reordering playlist for ${fissa.pin}...`);
      await reorderTracksFromPlaylist(fissa.pin);
      console.log(`reordering done for ${fissa.pin}`);
    } catch (error) {
      console.error(`reordering failed for ${fissa.pin}`, error);
    }
  }
};

const reorderTracksFromPlaylist = async (pin: string) => {
  const { tracks, currentIndex } = await prisma.fissa.findUniqueOrThrow({
    where: { pin },
    select: { tracks: true, currentIndex: true },
  });

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

const generateTrackIndexUpdates = (tracks: Track[], currentIndex: number) => {
  const tracksWithScoreOrAfterIndex = tracks.filter(
    ({ score, index }) => score !== 0 || index > currentIndex,
  );
  const tracksWithoutScoreAndBeforeIndex = tracks.filter(
    ({ score, index }) => score === 0 && index <= currentIndex,
  );

  const sortedTracks = [...tracksWithScoreOrAfterIndex].sort(
    (a, b) => b.score - a.score,
  );

  const sorted = tracksWithoutScoreAndBeforeIndex.concat(sortedTracks);
  const newCurrentIndex = sorted.findIndex(
    ({ index }) => index === currentIndex,
  );

  const updateMany = sorted
    .map(({ trackId, index }, newIndex) => {
      if (index === newIndex) return; // No need to update

      return {
        where: { trackId },
        data: { index: newIndex },
      };
    })
    .filter(Boolean);

  const fakeUpdates = updateMany.map((update, index) => ({
    ...update,
    data: { ...update.data, index: index + tracks.length + 100 }, // Set to an index which does not exist
  }));

  return { updateMany, fakeUpdates, newCurrentIndex };
};