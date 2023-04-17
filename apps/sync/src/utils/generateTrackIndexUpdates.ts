import { Track } from "@fissa/db";

export const generateTrackIndexUpdates = (
  tracks: Track[],
  currentIndex: number,
) => {
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

  const updates = sorted
    .map(({ trackId, index }, newIndex) => {
      if (index === newIndex) return; // No need to update

      return {
        where: { trackId },
        data: { index: newIndex },
      };
    })
    .filter(Boolean);

  return { updates, newCurrentIndex };
};
