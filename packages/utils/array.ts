export const splitInChunks = <T>(array: T[], chunkSize = 50): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};

export const sortTracksByScore = <T extends { score: number; trackId: string }>(
  tracks?: T[],
) => {
  if (!tracks) return [];

  return tracks.sort((a, b) => {
    if (a.score === b.score) {
      return a.trackId.localeCompare(b.trackId);
    }

    return b.score - a.score;
  });
};

export const randomSort = () => Number(Math.random() > 0.5);
