export const splitInChunks = <T>(array: T[], chunkSize = 50): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};
