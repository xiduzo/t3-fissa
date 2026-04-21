import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { type SearchTrack } from "~/components/AddTrackSheet";
import { useTrackSearch } from "~/hooks/useTrackSearch";
import { authClient } from "~/lib/auth-client";
import { api } from "~/utils/api";

export const Route = createFileRoute("/fissa/create")({
  component: CreateFissaRoute,
});

function CreateFissaRoute() {
  return <CreateFissa />;
}

type Step = "landing" | "playlist" | "tracks";

interface Playlist {
  id: string;
  name: string;
  imageUrl: string;
  trackCount: number;
}

export const CreateFissa: FC = () => {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("landing");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<SearchTrack[]>([]);
  const { query, setQuery, results, isLoading: searchLoading } = useTrackSearch();

  const { mutateAsync: createFissa, isPending: isCreating } = api.fissa.create.useMutation({
    onSuccess: (fissa) => {
      void navigate({ to: "/fissa/$pin", params: { pin: fissa.pin } });
    },
  });

  const { mutateAsync: getSurpriseTracks, isPending: isSurprising } =
    api.spotify.surpriseMe.useMutation();

  const { data: playlists = [], isLoading: playlistsLoading } =
    api.spotify.getMyPlaylists.useQuery(undefined, {
      enabled: !!session?.user && step === "playlist",
    });

  const { data: playlistTracks = [], isLoading: playlistTracksLoading } =
    api.spotify.getPlaylistTracks.useQuery(
      { playlistId: selectedPlaylist?.id ?? "" },
      { enabled: !!selectedPlaylist?.id },
    );

  const handleSignIn = () => {
    void authClient.signIn.social({ provider: "spotify", callbackURL: "/fissa/create" });
  };

  const handleBack = () => {
    if (step !== "landing") {
      setStep("landing");
      setSelectedPlaylist(null);
    } else {
      void navigate({ to: "/" });
    }
  };

  const handleSurpriseMe = async () => {
    const tracks = await getSurpriseTracks();
    await createFissa(tracks);
  };

  const handleStartFromPlaylist = async () => {
    if (!playlistTracks.length) return;
    await createFissa(
      playlistTracks.map((t) => ({ trackId: t.trackId, durationMs: t.durationMs })),
    );
  };

  const handleStartFromTracks = async () => {
    if (!selectedTracks.length) return;
    await createFissa(
      selectedTracks.map((t) => ({ trackId: t.id, durationMs: t.durationMs })),
    );
  };

  const toggleTrack = (track: SearchTrack) => {
    setSelectedTracks((prev) =>
      prev.some((t) => t.id === track.id)
        ? prev.filter((t) => t.id !== track.id)
        : [...prev, track],
    );
  };

  const isGlobalLoading = isCreating || isSurprising;

  if (!session?.user) {
    return (
      <div
        data-testid="create-fissa-page"
        className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
      >
        <h1 className="text-3xl font-bold">Create a Fissa</h1>
        <p className="text-lg text-muted-foreground">Sign in with Spotify to create a Fissa.</p>
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
    );
  }

  if (step === "playlist") {
    return (
      <div data-testid="create-fissa-page" className="flex min-h-screen flex-col">
        <header className="flex items-center gap-4 px-4 py-6">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full p-2 text-lg hover:bg-accent"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Create a Fissa</h1>
        </header>

        <h2 className="px-6 pb-4 text-xl font-semibold">Select playlist</h2>

        {playlistsLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Loading playlists…</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {playlists.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedPlaylist(p)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-accent"
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-12 w-12 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 flex-shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.trackCount} tracks</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedPlaylist && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setSelectedPlaylist(null)}
              aria-hidden="true"
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background p-6 shadow-lg">
              <p className="mb-2 text-center text-sm text-muted-foreground">
                Your fissa will start based on
              </p>
              <div className="mb-6 flex items-center gap-4 rounded-xl border p-4">
                {selectedPlaylist.imageUrl && (
                  <img
                    src={selectedPlaylist.imageUrl}
                    alt={selectedPlaylist.name}
                    className="h-14 w-14 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{selectedPlaylist.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlaylist.trackCount} tracks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartFromPlaylist}
                disabled={isCreating || playlistTracksLoading}
                className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {playlistTracksLoading
                  ? "Loading tracks…"
                  : isCreating
                    ? "Starting…"
                    : "Let's kick it"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (step === "tracks") {
    return (
      <div data-testid="create-fissa-page" className="flex min-h-screen flex-col">
        <header className="flex items-center gap-4 px-4 py-6">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full p-2 text-lg hover:bg-accent"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Create a Fissa</h1>
        </header>

        <div className="px-4 pb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Spotify…"
            className="w-full rounded-md border px-4 py-2 text-sm"
            autoFocus
          />
        </div>

        {selectedTracks.length > 0 && (
          <div className="px-4 pb-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Selected ({selectedTracks.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedTracks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTrack(t)}
                  className="flex items-center gap-1 rounded-full border bg-accent px-3 py-1 text-sm hover:bg-destructive/10"
                >
                  {t.name} ✕
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-4">
          {searchLoading && (
            <p className="py-4 text-center text-sm text-muted-foreground">Searching…</p>
          )}
          {!searchLoading && results.length > 0 && (
            <ul className="flex flex-col gap-2 pb-24">
              {results.map((track) => {
                const isSelected = selectedTracks.some((t) => t.id === track.id);
                return (
                  <li
                    key={track.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTrack(track)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleTrack(track);
                      }
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-md p-2 ${
                      isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent"
                    }`}
                  >
                    {track.albumArt ? (
                      <img
                        src={track.albumArt}
                        alt={track.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{track.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {track.artists.join(", ")}
                      </p>
                    </div>
                    {isSelected && <span className="text-primary">✓</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedTracks.length > 0 && (
          <div className="sticky bottom-0 border-t bg-background p-4">
            <button
              type="button"
              onClick={handleStartFromTracks}
              disabled={isCreating}
              className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isCreating ? "Starting…" : `Start fissa (${selectedTracks.length})`}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="create-fissa-page"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <div>
        <h1 className="text-3xl font-bold">Create a Fissa</h1>
        <p className="mt-2 text-muted-foreground">how would you like to start</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => setStep("playlist")}
          disabled={isGlobalLoading}
          className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Based on my playlist
        </button>
        <button
          type="button"
          onClick={() => setStep("tracks")}
          disabled={isGlobalLoading}
          className="w-full rounded-full border border-primary py-3 font-semibold text-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Select some songs
        </button>
        <button
          type="button"
          onClick={() => void handleSurpriseMe()}
          disabled={isGlobalLoading}
          className="w-full py-3 font-semibold text-muted-foreground underline transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSurprising || isCreating ? "Finding songs…" : "Surprise me"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleBack}
        className="text-sm text-muted-foreground underline"
      >
        Back to home
      </button>
    </div>
  );
};
