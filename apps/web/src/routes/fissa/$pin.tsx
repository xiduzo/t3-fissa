import { createFileRoute, Link } from "@tanstack/react-router";
import { type FC } from "react";
import { CurrentlyPlayingTrack } from "~/components/CurrentlyPlayingTrack";
import { Layout } from "~/components/Layout";
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

  if (isError) {
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
          {/* Placeholder — upcoming tracks list wired in a later task */}
        </section>

        {/* Unauthenticated sign-in CTA slot */}
        <section data-testid="queue-signin-cta" className="px-4 py-6">
          {/* Placeholder — sign-in CTA wired in a later task */}
        </section>
      </div>
    </Layout>
  );
};

function JoinFissa() {
  const { pin } = Route.useParams();
  return <QueuePage pin={pin} />;
}
