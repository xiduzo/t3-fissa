import { createFileRoute, Link } from "@tanstack/react-router";
import { type FC } from "react";
import { CurrentlyPlayingTrack } from "~/components/CurrentlyPlayingTrack";
import { Layout } from "~/components/Layout";
import { QueueTrackList } from "~/components/QueueTrackList";
import { api } from "~/utils/api";

export const Route = createFileRoute("/fissa/$pin")({
  component: JoinFissa,
});

interface QueuePageProps {
  pin: string;
}

export const QueuePage: FC<QueuePageProps> = ({ pin }) => {
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

        {/* Unauthenticated sign-in CTA slot */}
        <section data-testid="queue-signin-cta" className="flex flex-col items-center gap-3 px-4 py-6">
          {/* Placeholder — sign-in CTA wired in a later task */}
          <a
            href={`com.fissa://fissa/${pin}`}
            data-testid="open-mobile-app-cta"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Open in mobile app
          </a>
          {/* TODO: replace href with desktop scheme when defined */}
          <a
            href="#"
            data-testid="open-desktop-app-cta"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Open in desktop app
          </a>
        </section>
      </div>
    </Layout>
  );
};

function JoinFissa() {
  const { pin } = Route.useParams();
  return <QueuePage pin={pin} />;
}
