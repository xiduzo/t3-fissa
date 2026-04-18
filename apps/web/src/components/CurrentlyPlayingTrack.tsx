import { type FC } from "react";

interface CurrentlyPlayingTrackProps {
  track:
    | {
        trackId: string;
        durationMs: number;
        score: number;
        totalScore: number;
        hasBeenPlayed: boolean;
      }
    | undefined;
}

/**
 * Renders the currently playing track with artwork, track ID, and a progress bar.
 * Returns null when no track is provided.
 */
export const CurrentlyPlayingTrack: FC<CurrentlyPlayingTrackProps> = ({ track }) => {
  if (!track) return null;

  const artworkUrl = `https://i.scdn.co/image/ab67616d00004851${track.trackId}`;

  return (
    <div className="flex items-center gap-4">
      <img
        data-testid="track-artwork"
        src={artworkUrl}
        alt="Album artwork"
        width={80}
        height={80}
        className="rounded-md object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p data-testid="track-id" className="sr-only">
          {track.trackId}
        </p>

        <div
          data-testid="track-progress"
          className="h-1 w-full overflow-hidden rounded-full bg-white/20"
        >
          <div className="h-full w-1/3 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
};
