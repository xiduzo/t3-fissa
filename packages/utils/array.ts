export const splitInChunks = <T>(array: T[], chunkSize = 50): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};

const sortTrack = (a: { time: Date; trackId: string }, b: { time: Date; trackId: string }) => {
  const aTime = a.time.getTime();
  const bTime = b.time.getTime();

  if (aTime === bTime) return a.trackId.localeCompare(b.trackId);

  return aTime - bTime;
};

type SortableTrack = {
  score: number;
  trackId: string;
  lastUpdateAt: Date;
  createdAt: Date;
  hasBeenPlayed: boolean;
};

export const sortFissaTracksOrder = <T extends SortableTrack>(
  tracks?: T[],
  activeTrackId?: string | null,
) => {
  if (!tracks) return [];

  let sortedTracks: T[] = [];

  const playedTracks = tracks.filter(
    ({ hasBeenPlayed, trackId }) => hasBeenPlayed && trackId !== activeTrackId,
  );
  const unplayedTracks = tracks.filter(
    ({ hasBeenPlayed, trackId }) => !hasBeenPlayed && trackId !== activeTrackId,
  );
  const activeTrack = tracks.find(({ trackId }) => trackId === activeTrackId);

  const sortedPlayedTracks = playedTracks.sort((a, b) => {
    return sortTrack({ ...a, time: a.lastUpdateAt }, { ...b, time: b.lastUpdateAt });
  });

  const sortedUnplayedTracks = unplayedTracks.sort((a, b) => {
    if (a.score === b.score) {
      return sortTrack({ ...a, time: a.createdAt }, { ...b, time: b.createdAt });
    }

    return b.score - a.score;
  });

  sortedTracks = sortedTracks.concat(sortedPlayedTracks);
  if (activeTrack) sortedTracks.push(activeTrack);
  sortedTracks = sortedTracks.concat(sortedUnplayedTracks);

  return sortedTracks;
};

export const randomSort = () => Number(Math.random() > 0.5);
