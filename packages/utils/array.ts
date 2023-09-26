export const splitInChunks = <T>(array: T[], chunkSize = 50): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};

const sortTrack = (date: keyof Dates) => (a: SortableTrack, b: SortableTrack) => {
  const aTime = a[date].getTime();
  const bTime = b[date].getTime();

  if (a.score !== b.score) return b.score - a.score;
  if (aTime === bTime) return a.trackId.localeCompare(b.trackId);

  return aTime - bTime;
};

type Dates = {
  lastUpdateAt: Date;
  createdAt: Date;
};

export type SortableTrack = {
  score: number;
  trackId: string;
  hasBeenPlayed: boolean;
} & Dates;

export const sortFissaTracksOrder = <T extends SortableTrack>(
  tracks?: T[],
  activeTrackId?: string | null,
) => {
  if (!tracks) return [];

  const { played, unplayed, active } = tracks.reduce(
    (acc, track) => {
      const { hasBeenPlayed, trackId } = track;

      if (trackId === activeTrackId) acc.active = track;
      else if (hasBeenPlayed) acc.played.push(track);
      else acc.unplayed.push(track);

      return acc;
    },
    { played: [] as T[], unplayed: [] as T[], active: null as T | null },
  );

  const sortedPlayedTracks = played.sort(sortTrack("lastUpdateAt"));
  const sortedUnplayedTracks = unplayed.sort(sortTrack("createdAt"));

  return [...sortedPlayedTracks, ...(active ? [active] : []), ...sortedUnplayedTracks];
};

export const randomSort = () => Number(Math.random() > 0.5);
