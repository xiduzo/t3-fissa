import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FC, useCallback, useState } from "react";
import { AddTrackSheet, type SearchTrack } from "~/components/AddTrackSheet";
import { CurrentlyPlayingTrack } from "~/components/CurrentlyPlayingTrack";
import { Layout } from "~/components/Layout";
import { QueueTrackList } from "~/components/QueueTrackList";
import { SpotifySignInButton } from "~/components/SpotifySignInButton";
import { toast } from "~/components/Toast";
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [optimisticVotes, setOptimisticVotes] = useState<Map<string, 1 | -1>>(new Map());
  const [voteErrors, setVoteErrors] = useState<Map<string, { vote: 1 | -1 }>>(new Map());
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navigate = useNavigate({ from: "/fissa/$pin" });
  const dismissError = () => void navigate({ to: "/fissa/$pin", params: { pin }, search: {} });
  const utils = api.useUtils();

  const { data, isLoading, isError } = api.fissa.byId.useQuery(pin, {
    retry: false,
    enabled: !!pin,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const { data: votesData } = api.vote.byFissaFromUser.useQuery(
    { pin },
    { enabled: !!pin && !!session?.user },
  );

  // Merge server votes with optimistic updates (optimistic takes precedence)
  const userVotes = new Map(
    (votesData ?? []).map((v) => [v.trackId, v.score as 1 | -1]),
  );
  for (const [trackId, score] of optimisticVotes) {
    userVotes.set(trackId, score);
  }

  const { mutate: createVote } = api.vote.create.useMutation({
    onMutate: ({ trackId, vote }) => {
      const previousVote = optimisticVotes.get(trackId) ?? null;
      setOptimisticVotes((prev) => {
        const next = new Map(prev);
        next.set(trackId, vote as 1 | -1);
        return next;
      });
      return { previousVote, trackId };
    },
    onSuccess: (_data: unknown, vars?: { trackId?: string }) => {
      if (vars?.trackId) {
        setVoteErrors((prev) => {
          const next = new Map(prev);
          next.delete(vars.trackId!);
          return next;
        });
      }
      void utils.vote.byFissaFromUser.invalidate({ pin });
      void utils.fissa.byId.invalidate(pin);
    },
    onError: (err, { trackId, vote }, context) => {
      setOptimisticVotes((prev) => {
        const next = new Map(prev);
        if (context?.previousVote != null) {
          next.set(trackId, context.previousVote as 1 | -1);
        } else {
          next.delete(trackId);
        }
        return next;
      });
      setVoteErrors((prev) => new Map(prev).set(trackId, { vote: vote as 1 | -1 }));
      const tRPCError = err as { data?: { code?: string } };
      if (tRPCError?.data?.code === "NOT_FOUND") {
        void utils.fissa.byId.invalidate(pin);
      }
    },
  });

  const handleVote = useCallback(
    (trackId: string, vote: 1 | -1) => {
      createVote({ pin, trackId, vote });
    },
    [createVote, pin],
  );

  const handleRetryVote = useCallback(
    (trackId: string, vote: 1 | -1) => {
      setVoteErrors((prev) => {
        const next = new Map(prev);
        next.delete(trackId);
        return next;
      });
      createVote({ pin, trackId, vote });
    },
    [createVote, pin],
  );

  const { mutate: addTracks, isPending: isAdding } = api.track.addTracks.useMutation({
    onSuccess: () => {
      setIsSheetOpen(false);
      toast.success({ message: "Track added to queue!" });
    },
    onError: () => {
      void navigate({ to: "/fissa/$pin", params: { pin }, search: { error: "add_track_failed" } });
    },
  });

  const handleSelect = useCallback(
    (track: SearchTrack) => {
      if (isAdding) return;
      addTracks({ pin, tracks: [{ trackId: track.id, durationMs: track.durationMs }] });
    },
    [addTracks, isAdding, pin],
  );

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
            <QueueTrackList
              tracks={upcomingTracks}
              isAuthenticated={!!session?.user}
              currentlyPlayingId={data?.currentlyPlayingId ?? undefined}
              userVotes={session?.user ? userVotes : undefined}
              onVote={session?.user ? handleVote : undefined}
              voteErrors={voteErrors}
              onRetryVote={handleRetryVote}
            />
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

        {/* Unauthenticated sign-in CTA + native app links */}
        <section data-testid="queue-signin-cta" className="flex flex-col items-center gap-3 px-4 py-6">
          {!sessionPending && !session?.user && <SpotifySignInButton pin={pin} />}
          <a
            href={`com.fissa://fissa/${pin}`}
            data-testid="open-mobile-app-cta"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Open in mobile app
          </a>
          {/* TODO: replace href with desktop scheme when defined */}
          <a
            href="#"
            data-testid="open-desktop-app-cta"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Open in desktop app
          </a>
        </section>

        {/* Queue interaction controls — visible only for authenticated guests */}
        {session?.user && (
          <section data-testid="queue-interaction-controls" className="px-4 py-4">
            <button
              data-testid="add-track-btn"
              className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              type="button"
              onClick={() => setIsSheetOpen(true)}
            >
              Add Track
            </button>
            <div data-testid="vote-controls">{/* Vote controls wired via QueueTrackList */}</div>
          </section>
        )}
      </div>
      <AddTrackSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        pin={pin}
        onSelect={handleSelect}
        isAdding={isAdding}
      />
    </Layout>
  );
};

function JoinFissa() {
  const { pin } = Route.useParams();
  const { error } = Route.useSearch();
  return <QueuePage pin={pin} error={error} />;
}
