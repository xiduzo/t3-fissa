export const splitInChunks = <T>(array: T[], chunkSize = 50): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};

export const sortTracksByScore = <
  T extends { score: number; trackId: string; createdAt: Date },
>(
  tracks?: T[],
) => {
  if (!tracks) return [];

  return tracks.sort((a, b) => {
    if (a.score === b.score) {
      const aTime = a.createdAt.getTime();
      const bTime = b.createdAt.getTime();

      // When added in a batch (and the time is the same)
      // Js is acting up and we can not rely on it for sorting
      return aTime === bTime
        ? a.trackId.localeCompare(b.trackId)
        : aTime - bTime;
    }

    return b.score - a.score;
  });
};

export const randomSort = () => Number(Math.random() > 0.5);
