export const splitInChunks = <T>(array: T[], chunkSize = 50): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};

const sortTrack = (
  a: { time: Date; trackId: string },
  b: { time: Date; trackId: string },
) => {
  const aTime = a.time.getTime();
  const bTime = b.time.getTime();

  if (aTime === bTime) return a.trackId.localeCompare(b.trackId);

  return aTime - bTime;
};

export const sortFissaTracksOrder = <
  T extends {
    score: number;
    trackId: string;
    lastUpdateAt: Date;
    createdAt: Date;
    hasBeenPlayed: boolean;
  },
>(
  tracks?: T[],
) => {
  if (!tracks) return [];

  const playedTracks = tracks.filter(({ hasBeenPlayed }) => hasBeenPlayed);
  const unplayedTracks = tracks.filter(({ hasBeenPlayed }) => !hasBeenPlayed);

  const sortedPlayedTracks = playedTracks.sort((a, b) => {
    return sortTrack(
      { ...a, time: a.lastUpdateAt },
      { ...b, time: b.lastUpdateAt },
    );
  });

  const sortedUnplayedTracks = unplayedTracks.sort((a, b) => {
    if (a.score === b.score) {
      return sortTrack(
        { ...a, time: a.createdAt },
        { ...b, time: b.createdAt },
      );
    }

    return b.score - a.score;
  });

  return [...sortedPlayedTracks, ...sortedUnplayedTracks];
};

export const randomSort = () => Number(Math.random() > 0.5);
