import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { authClient } from "~/lib/auth-client";
import { api } from "~/utils/api";

export const Route = createFileRoute("/fissa/create")({
  component: CreateFissaRoute,
});

function CreateFissaRoute() {
  return <CreateFissa />;
}

const MIN_SEED_TRACKS = 1;

type SearchTrack = {
  id: string;
  name: string;
  artists: string[];
  albumArt: string;
  durationMs: number;
};

export const CreateFissa: FC = () => {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<Map<string, SearchTrack>>(new Map());
  const [createError, setCreateError] = useState<string | null>(null);

  const { mutate: createFissa, isPending: isCreating } = api.fissa.create.useMutation({
    onSuccess: (fissa) => {
      console.log("Fissa created:", fissa.pin);
    },
    onError: (err) => {
      setCreateError(err.message);
    },
  });

  // Only query when user has typed something
  const { data: searchData, isLoading: isSearchLoading } = api.spotify.searchTracks.useQuery(
    { query: searchQuery },
    { enabled: !!session?.user && searchQuery.length > 0 },
  );

  const searchResults = searchData?.tracks ?? [];

  const handleSignIn = () => {
    void authClient.signIn.social({
      provider: "spotify",
      callbackURL: "/fissa/create",
    });
  };

  const handleBack = () => {
    void navigate({ to: "/" });
  };

  const toggleTrack = (track: SearchTrack) => {
    setSelectedTracks((prev) => {
      const next = new Map(prev);
      if (next.has(track.id)) {
        next.delete(track.id);
      } else {
        next.set(track.id, track);
      }
      return next;
    });
  };

  const selectedCount = selectedTracks.size;
  const tracksNeeded = Math.max(0, MIN_SEED_TRACKS - selectedCount);
  const canSubmit = selectedCount >= MIN_SEED_TRACKS;

  const handleSubmit = () => {
    if (!canSubmit || isCreating) return;
    setCreateError(null);
    createFissa(
      Array.from(selectedTracks.values()).map((t) => ({
        trackId: t.id,
        durationMs: t.durationMs,
      })),
    );
  };

  return (
    <div data-testid="create-fissa-page" className="flex min-h-screen flex-col items-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Create a Fissa</h1>

      {!session?.user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-gray-600">Sign in with Spotify to create a Fissa.</p>
          <button
            data-testid="create-fissa-signin-btn"
            onClick={handleSignIn}
            className="flex items-center justify-center gap-3 rounded-full px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: "#1DB954" }}
            type="button"
          >
            Sign in with Spotify
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-lg flex-col gap-6">
          {/* Track search input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="track-search" className="text-sm font-medium text-gray-700">
              Search for tracks to seed your Fissa
            </label>
            <input
              id="track-search"
              data-testid="track-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Spotify…"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Search results */}
          {isSearchLoading && (
            <div data-testid="track-search-loading" className="text-center text-sm text-gray-500">
              Searching…
            </div>
          )}

          {!isSearchLoading && searchQuery.length > 0 && searchResults.length === 0 && (
            <div data-testid="track-search-empty" className="text-center text-sm text-gray-500">
              No tracks found for "{searchQuery}"
            </div>
          )}

          {!isSearchLoading && searchResults.length > 0 && (
            <ul data-testid="track-search-results" className="flex flex-col gap-2">
              {searchResults.map((track) => {
                const isSelected = selectedTracks.has(track.id);
                return (
                  <li
                    key={track.id}
                    data-testid={`search-result-${track.id}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleTrack(track)}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleTrack(track);
                    }}
                  >
                    <img
                      data-testid={`search-result-artwork-${track.id}`}
                      src={track.albumArt}
                      alt={track.name}
                      className="h-10 w-10 flex-shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        data-testid={`search-result-name-${track.id}`}
                        className="truncate text-sm font-medium text-gray-900"
                      >
                        {track.name}
                      </p>
                      <p
                        data-testid={`search-result-artists-${track.id}`}
                        className="truncate text-xs text-gray-500"
                      >
                        {track.artists.join(", ")}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-green-600" aria-hidden>
                        ✓
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Selected tracks summary */}
          {selectedCount > 0 && (
            <div data-testid="selected-tracks-summary" className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Selected tracks:{" "}
                <span data-testid="selected-count" className="text-green-600">
                  {selectedCount}
                </span>
              </p>
              <ul className="flex flex-col gap-1">
                {Array.from(selectedTracks.values()).map((track) => (
                  <li key={track.id} className="text-xs text-gray-600">
                    {track.name} — {track.artists.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tracks needed message */}
          {tracksNeeded > 0 && (
            <p data-testid="tracks-needed-message" className="text-center text-sm text-gray-500">
              Select at least {tracksNeeded} more track{tracksNeeded !== 1 ? "s" : ""} to start your Fissa
            </p>
          )}

          {/* Error message */}
          {createError && (
            <p data-testid="create-fissa-error" className="text-sm text-red-600">{createError}</p>
          )}

          {/* Submit button */}
          <button
            data-testid="create-fissa-submit-btn"
            disabled={!canSubmit || isCreating}
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-full px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "#1DB954" }}
          >
            {isCreating ? <span data-testid="create-fissa-loading">Creating…</span> : "Start Fissa"}
          </button>
        </div>
      )}

      <button
        data-testid="create-fissa-back-btn"
        onClick={handleBack}
        className="text-sm text-gray-500 underline"
        type="button"
      >
        Back to home
      </button>
    </div>
  );
};
