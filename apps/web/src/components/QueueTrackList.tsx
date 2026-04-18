import { type FC } from "react";

interface QueueTrack {
  trackId: string;
  totalScore: number;
  hasBeenPlayed: boolean;
  durationMs: number;
}

interface QueueTrackListProps {
  tracks: QueueTrack[];
}

/**
 * Renders the upcoming tracks queue sorted by totalScore descending.
 * Each track shows artwork (Spotify CDN), track identifier, and vote tally.
 * Defensively filters out already-played tracks.
 */
export const QueueTrackList: FC<QueueTrackListProps> = ({ tracks }) => {
  const sorted = [...tracks]
    .filter((t) => !t.hasBeenPlayed)
    .sort((a, b) => b.totalScore - a.totalScore);

  return (
    <ul data-testid="track-list" className="flex flex-col gap-3">
      {sorted.map((track) => {
        const artworkUrl = `https://i.scdn.co/image/ab67616d00004851${track.trackId}`;

        return (
          <li
            key={track.trackId}
            data-testid="track-item"
            data-trackid={track.trackId}
            className="flex items-center gap-3"
          >
            <img
              data-testid={`queue-track-artwork-${track.trackId}`}
              src={artworkUrl}
              alt="Album artwork"
              width={56}
              height={56}
              className="rounded-md object-cover"
            />

            <div className="flex min-w-0 flex-1 flex-col">
              <p
                data-testid={`queue-track-id-${track.trackId}`}
                className="truncate text-sm font-medium"
              >
                {track.trackId}
              </p>
            </div>

            <span
              data-testid={`queue-track-score-${track.trackId}`}
              className="text-sm font-semibold tabular-nums"
            >
              {track.totalScore}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
