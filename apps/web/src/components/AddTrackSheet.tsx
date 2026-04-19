import { type FC, useState } from "react";
import { api } from "~/utils/api";
import { useDebounce } from "~/hooks/useDebounce";

interface AddTrackSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string;
  addError?: boolean;
  onRetry?: () => void;
  fissaEnded?: boolean;
}

export const AddTrackSheet: FC<AddTrackSheetProps> = ({ isOpen, onClose, pin, addError, onRetry, fissaEnded }) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = api.spotify.searchTracks.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  const results = data?.tracks ?? [];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        data-testid="add-track-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Add Track"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Track</h2>
          <button
            data-testid="add-track-sheet-close"
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-accent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {fissaEnded ? (
          <div data-testid="fissa-ended-state" className="mt-4 text-center text-sm text-gray-500">
            This fissa has ended.
          </div>
        ) : null}

        <input
          data-testid="track-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Spotify…"
          className="mt-4 w-full rounded-md border px-4 py-2 text-sm"
          disabled={fissaEnded}
        />

        {!fissaEnded && isLoading && (
          <div data-testid="track-search-loading" className="mt-4 text-center text-sm text-gray-500">
            Searching…
          </div>
        )}

        {!fissaEnded && !isLoading && results.length > 0 && (
          <ul data-testid="track-search-results" className="mt-4 flex flex-col gap-2">
            {results.map((track) => (
              <li key={track.id} data-testid={`search-result-${track.id}`} className="flex items-center gap-3">
                <img
                  data-testid={`search-result-artwork-${track.id}`}
                  src={track.albumArt}
                  alt={track.name}
                  className="h-10 w-10 rounded object-cover"
                />
                <div>
                  <p data-testid={`search-result-name-${track.id}`} className="text-sm font-medium">
                    {track.name}
                  </p>
                  <p data-testid={`search-result-artists-${track.id}`} className="text-xs text-gray-500">
                    {track.artists.join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!fissaEnded && !isLoading && results.length === 0 && debouncedQuery.length > 0 && (
          <div data-testid="track-search-empty" className="mt-4 text-center text-sm text-gray-500">
            No tracks found
          </div>
        )}

        {!fissaEnded && addError && (
          <div data-testid="track-add-error" className="mt-4 text-center text-sm text-red-500">
            Failed to add track.{" "}
            <button
              data-testid="track-add-retry-btn"
              type="button"
              onClick={onRetry}
              className="underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </>
  );
};
