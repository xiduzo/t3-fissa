export const splitInChunks = <T>(array: T[], chunkSize = 50): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};

export const sortTracksByScore = <T extends { score: number; createdAt: Date }>(
  tracks?: T[],
) => {
  if (!tracks) return [];
  
  return tracks.sort((a, b) => {
    if (a.score === b.score) {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }

    return b.score - a.score;
  });
};
