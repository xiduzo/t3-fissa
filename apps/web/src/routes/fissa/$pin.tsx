import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FC } from "react";
import { CurrentlyPlayingTrack } from "~/components/CurrentlyPlayingTrack";
import { Layout } from "~/components/Layout";
import { QueueTrackList } from "~/components/QueueTrackList";
import { SpotifySignInButton } from "~/components/SpotifySignInButton";
import { authClient } from "~/lib/auth-client";
import { api } from "~/utils/api";

export const Route = createFileRoute("/fissa/$pin")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: JoinFissa,
});

interface QueuePageProps {
  pin: string;
  error?: string;
}

export const QueuePage: FC<QueuePageProps> = ({ pin, error }) => {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navigate = useNavigate({ from: "/fissa/$pin" });
  const dismissError = () => void navigate({ to: "/fissa/$pin", params: { pin }, search: {} });
  const { data, isLoading, isError } = api.fissa.byId.useQuery(pin, {
    retry: false,
    enabled: !!pin,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  if (isLoading) {
    return (
      <Layout>
        <div data-testid="fissa-loading" className="flex min-h-screen items-center justify-center">
          <p className="text-lg">Loading…</p>
        </div>
      </Layout>
    );
  }

  if (isError && !data) {
    return (
      <Layout>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <p data-testid="fissa-not-found" className="text-2xl font-bold">
            Fissa not found
          </p>
          <Link data-testid="go-home-link" to="/" className="underline">
            Go home
          </Link>
        </div>
      </Layout>
    );
  }

  const hasFissaEnded =
    data?.expectedEndTime != null &&
    new Date(data.expectedEndTime) < new Date();

  if (hasFissaEnded) {
    return (
      <Layout>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <p data-testid="fissa-ended" className="text-2xl font-bold">
            Fissa has ended
          </p>
          <Link data-testid="go-home-link" to="/" className="underline">
            Go home
          </Link>
        </div>
      </Layout>
    );
  }

  const currentlyPlayingTrack = data?.tracks?.find(
    (t) => t.trackId === data.currentlyPlayingId,
  );

  const upcomingTracks = data?.tracks?.filter(
    (t) => !t.hasBeenPlayed && t.trackId !== data?.currentlyPlayingId,
  ) ?? [];

  return (
    <Layout>
      <div className="flex min-h-screen flex-col">
        {/* Header: Fissa PIN */}
        <header className="px-4 py-6 text-center">
          <h1 className="text-2xl font-bold tracking-widest">{pin}</h1>
        </header>

        {/* Currently-playing track slot */}
        <section data-testid="queue-now-playing" className="px-4 py-4">
          <CurrentlyPlayingTrack track={currentlyPlayingTrack} />
        </section>

        {/* Upcoming tracks list slot */}
        <section data-testid="queue-upcoming" className="flex-1 px-4 py-4">
          {upcomingTracks.length === 0 ? (
            <p data-testid="queue-empty" className="text-center text-muted-foreground">
              No upcoming tracks
            </p>
          ) : (
            <QueueTrackList tracks={upcomingTracks} />
          )}
        </section>

        {/* OAuth error banner */}
        {error && (
          <div data-testid="oauth-error-banner" role="alert" className="mx-4 my-2 flex items-center justify-between rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>Sign-in was cancelled or failed. Please try again.</span>
            <button data-testid="dismiss-error-btn" onClick={dismissError} className="ml-4 text-xs underline" type="button">
              Dismiss
            </button>
          </div>
        )}

        {/* Unauthenticated sign-in CTA slot */}
        <section data-testid="queue-signin-cta" className="px-4 py-6">
          {!sessionPending && !session?.user && <SpotifySignInButton pin={pin} />}
        </section>

        {/* Queue interaction controls — visible only for authenticated guests */}
        {session?.user && (
          <section data-testid="queue-interaction-controls" className="px-4 py-4">
            <button data-testid="add-track-btn" className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90" type="button">
              Add Track
            </button>
            <div data-testid="vote-controls">{/* Vote controls — Feature #47 */}</div>
          </section>
        )}
      </div>
    </Layout>
  );
};

function JoinFissa() {
  const { pin } = Route.useParams();
  const { error } = Route.useSearch();
  return <QueuePage pin={pin} error={error} />;
}
