/**
 * Tests for /fissa/$pin page (Task #57)
 *
 * Scenario: Fissa page renders layout without automatic redirect
 * Scenario: Visitor with native app installed is not auto-redirected
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────────
// Note: vi.mock factories are hoisted — no variable references allowed inside.

vi.mock("~/utils/api", () => ({
  api: {
    fissa: {
      byId: {
        useQuery: vi.fn().mockReturnValue({
          data: undefined,
          isLoading: true,
          error: null,
        }),
      },
    },
  },
}));

vi.mock("~/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: { 500: "#ff0", 900: "#000" } }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({ component: null }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock("~/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("~/components/Container", () => ({
  Container: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("~/components/Button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("~/components/Toast", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("~/components/CurrentlyPlayingTrack", () => ({
  CurrentlyPlayingTrack: ({ track }: { track?: { trackId: string } }) =>
    track ? <div data-testid="currently-playing-track">{track.trackId}</div> : null,
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { api } from "~/utils/api";
import { QueuePage } from "./$pin";

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("/fissa/$pin — Queue view layout scaffold", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
  });

  /**
   * Scenario: Fissa page renders layout without automatic redirect
   *   Then the page displays a Queue view layout with the PIN
   */
  it("renders the Queue layout scaffold with the Fissa PIN", () => {
    mockUseQuery.mockReturnValue({
      data: { pin: "ABC123" },
      isLoading: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    // PIN is visible in the header area
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();

    // Queue view sections are present as placeholders
    expect(screen.getByTestId("queue-now-playing")).toBeInTheDocument();
    expect(screen.getByTestId("queue-upcoming")).toBeInTheDocument();
    expect(screen.getByTestId("queue-signin-cta")).toBeInTheDocument();
  });

  /**
   * Scenario: Fissa page renders layout without automatic redirect
   *   Then the Party Guest remains on "/fissa/ABC123"
   *   (i.e. no window.location.replace is called on load)
   */
  it("does not call window.location.replace when query succeeds", () => {
    const replaceSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, replace: replaceSpy },
      writable: true,
      configurable: true,
    });

    // Simulate the query succeeding — if onSuccess is still in the code it would fire
    mockUseQuery.mockImplementation((_pin: string, options?: { onSuccess?: (data: unknown) => void }) => {
      options?.onSuccess?.({ pin: "ABC123" });
      return { data: { pin: "ABC123" }, isLoading: false, error: null } as any;
    });

    render(<QueuePage pin="ABC123" />);

    // No deep-link redirect should have been triggered
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  /**
   * Scenario: Visitor with native app installed is not auto-redirected
   *   Then the browser does not navigate away from "/fissa/ABC123"
   *   And no deep-link redirect is triggered automatically
   */
  it("does not trigger a com.fissa:// deep-link redirect automatically", () => {
    const replaceSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, replace: replaceSpy },
      writable: true,
      configurable: true,
    });

    mockUseQuery.mockReturnValue({
      data: { pin: "ABC123" },
      isLoading: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(replaceSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalledWith(expect.stringContaining("com.fissa://"));
  });

  /**
   * The "Join Fissa" button (which called window.location.replace) must be removed.
   */
  it("does not render the old 'Join Fissa' button", () => {
    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByRole("button", { name: /join fissa/i })).not.toBeInTheDocument();
  });
});

describe("/fissa/$pin — Currently playing track (Task #59)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
  });

  /**
   * Scenario: Currently playing track is rendered on page load
   *   Given a valid Fissa PIN with an active Fissa
   *   And the Fissa has a currentlyPlayingId set
   *   When the visitor navigates to /fissa/<pin>
   *   Then the currently playing track is rendered in the now-playing slot
   */
  it("renders the currently playing track when currentlyPlayingId matches a track", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "4uLU6hMCjMI75M1A2tKUQC",
        tracks: [
          {
            trackId: "4uLU6hMCjMI75M1A2tKUQC",
            durationMs: 210000,
            score: 3,
            totalScore: 10,
            hasBeenPlayed: false,
          },
        ],
      },
      isLoading: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("currently-playing-track")).toBeInTheDocument();
    expect(screen.getByTestId("currently-playing-track")).toHaveTextContent("4uLU6hMCjMI75M1A2tKUQC");
  });

  /**
   * Scenario: No currently playing track
   *   Given a valid Fissa PIN with an active Fissa
   *   And the Fissa has no currentlyPlayingId set
   *   When the visitor navigates to /fissa/<pin>
   *   Then the CurrentlyPlayingTrack slot is empty
   */
  it("renders nothing in the now-playing slot when currentlyPlayingId is null", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        tracks: [
          {
            trackId: "4uLU6hMCjMI75M1A2tKUQC",
            durationMs: 210000,
            score: 3,
            totalScore: 10,
            hasBeenPlayed: false,
          },
        ],
      },
      isLoading: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("currently-playing-track")).not.toBeInTheDocument();
  });
});

describe("/fissa/$pin — Fissa-not-found and Fissa-ended states (Task #64)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: PIN does not correspond to an active Fissa
   *   Given a visitor navigates to /fissa/<invalid-pin>
   *   When fissa.byId returns a NOT_FOUND error
   *   Then a "Fissa not found" message is shown
   *   And a link or button to go home is displayed
   *   And the page does not crash
   */
  it("shows Fissa-not-found UI when the query returns an error", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Fissa not found: XXXX" },
    } as any);

    render(<QueuePage pin="XXXX" />);

    expect(screen.getByTestId("fissa-not-found")).toBeInTheDocument();
    expect(screen.getByTestId("fissa-not-found")).toHaveTextContent(/fissa not found/i);
    expect(screen.getByTestId("go-home-link")).toBeInTheDocument();
  });

  /**
   * Scenario: PIN does not correspond to an active Fissa — page does not crash
   *   The queue sections must NOT be rendered when error state is active.
   */
  it("does not render queue sections when isError is true", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Fissa not found: XXXX" },
    } as any);

    render(<QueuePage pin="XXXX" />);

    expect(screen.queryByTestId("queue-now-playing")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-upcoming")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-signin-cta")).not.toBeInTheDocument();
  });

  /**
   * Scenario: Visitor arrives after Fissa has already ended
   *   Given a Fissa that has ended (expectedEndTime is in the past)
   *   When a visitor navigates to /fissa/<pin>
   *   Then a "Fissa has ended" message is shown immediately
   *   And a link or button to go home is displayed
   */
  it("shows Fissa-ended UI when expectedEndTime is in the past", () => {
    const pastTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        expectedEndTime: pastTime,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("fissa-ended")).toBeInTheDocument();
    expect(screen.getByTestId("fissa-ended")).toHaveTextContent(/fissa has ended/i);
    expect(screen.getByTestId("go-home-link")).toBeInTheDocument();
  });

  /**
   * Scenario: Fissa has ended — queue sections must not be rendered
   */
  it("does not render queue sections when Fissa has ended", () => {
    const pastTime = new Date(Date.now() - 1000 * 60 * 60);
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        expectedEndTime: pastTime,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("queue-now-playing")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-upcoming")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-signin-cta")).not.toBeInTheDocument();
  });

  /**
   * Scenario: Fissa ends while visitor is watching
   *   Given a visitor is viewing an active Fissa page
   *   When the next poll detects expectedEndTime has passed
   *   Then the page transitions to a "Fissa has ended" message
   */
  it("transitions to Fissa-ended state when expectedEndTime passes during polling", () => {
    // First render with active fissa
    const futureTime = new Date(Date.now() + 1000 * 60); // 1 minute in future
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "trackId",
        expectedEndTime: futureTime,
        tracks: [{ trackId: "trackId", durationMs: 210000, score: 0, totalScore: 0, hasBeenPlayed: false }],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { rerender } = render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("fissa-ended")).not.toBeInTheDocument();

    // Simulate poll returning ended state
    const pastTime = new Date(Date.now() - 1000);
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        expectedEndTime: pastTime,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    rerender(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("fissa-ended")).toBeInTheDocument();
  });

  /**
   * Scenario: Loading state is shown while query is in-flight
   */
  it("shows a loading indicator while the query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("fissa-loading")).toBeInTheDocument();
  });

  /**
   * Loading state — queue sections must not be rendered while loading
   */
  it("does not render queue sections while loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("queue-now-playing")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-upcoming")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-signin-cta")).not.toBeInTheDocument();
  });
});

describe("/fissa/$pin — Empty queue state (Task #65)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Active Fissa with no upcoming tracks
   *   Given a valid Fissa PIN with an active Fissa
   *   And the Fissa has only one track which is currently playing
   *   When the visitor navigates to /fissa/<pin>
   *   Then an empty-queue message is shown in the queue area (data-testid="queue-empty")
   */
  it("shows empty-queue message when the only track is currently playing", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 0 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("queue-empty")).toBeInTheDocument();
    expect(screen.getByTestId("queue-empty")).toHaveTextContent(/no upcoming tracks/i);
  });

  /**
   * Scenario: Active Fissa where all tracks have been played
   *   Given all tracks have hasBeenPlayed: true except the currently playing one
   *   Then an appropriate empty-queue state is displayed
   */
  it("shows empty-queue message when all non-playing tracks have been played", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 0 },
          { trackId: "track-2", hasBeenPlayed: true, durationMs: 180000, score: 0, totalScore: 0 },
          { trackId: "track-3", hasBeenPlayed: true, durationMs: 200000, score: 0, totalScore: 0 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("queue-empty")).toBeInTheDocument();
    expect(screen.getByTestId("queue-empty")).toHaveTextContent(/no upcoming tracks/i);
  });

  /**
   * Scenario: Empty queue transitions to populated queue on next poll
   *   When new tracks are added and next poll completes
   *   Then data-testid="queue-empty" is NOT present when upcomingTracks.length > 0
   */
  it("does not show empty-queue message when there are upcoming tracks", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 0 },
          { trackId: "track-2", hasBeenPlayed: false, durationMs: 180000, score: 0, totalScore: 0 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("queue-empty")).not.toBeInTheDocument();
  });

  /**
   * Empty-queue message must NOT appear when Fissa is loading
   */
  it("does not show empty-queue message while loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("queue-empty")).not.toBeInTheDocument();
  });

  /**
   * Empty-queue message must NOT appear when Fissa is not found
   */
  it("does not show empty-queue message when Fissa is not found", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Fissa not found" },
    } as any);

    render(<QueuePage pin="XXXX" />);

    expect(screen.queryByTestId("queue-empty")).not.toBeInTheDocument();
  });

  /**
   * Empty-queue message must NOT appear when Fissa has ended
   */
  it("does not show empty-queue message when Fissa has ended", () => {
    const pastTime = new Date(Date.now() - 1000 * 60 * 60);
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        expectedEndTime: pastTime,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("queue-empty")).not.toBeInTheDocument();
  });

  /**
   * Currently playing track must still be shown even when queue is empty
   */
  it("still shows the currently playing track alongside the empty-queue message", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 0 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("queue-now-playing")).toBeInTheDocument();
    expect(screen.getByTestId("currently-playing-track")).toBeInTheDocument();
    expect(screen.getByTestId("queue-empty")).toBeInTheDocument();
  });
});

describe("/fissa/$pin — Auto-polling every 5 seconds (Task #62)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Queue updates automatically while tab is active
   *   Given a visitor is viewing the Fissa page
   *   When 5 seconds elapse
   *   Then the queue and currently playing track are refreshed without a page reload
   *   (verify refetchInterval: 5000 is passed to useQuery)
   */
  it("passes refetchInterval: 5000 to useQuery", () => {
    render(<QueuePage pin="ABC123" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      "ABC123",
      expect.objectContaining({ refetchInterval: 5000 }),
    );
  });

  /**
   * Scenario: Polling pauses when tab is hidden
   *   Given a visitor is viewing the Fissa page
   *   When the visitor switches to another browser tab
   *   Then no new requests are sent to fissa.byId
   *   (verify refetchIntervalInBackground: false is passed to useQuery)
   */
  it("passes refetchIntervalInBackground: false to useQuery", () => {
    render(<QueuePage pin="ABC123" />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      "ABC123",
      expect.objectContaining({ refetchIntervalInBackground: false }),
    );
  });

  /**
   * Scenario: Network error during polling preserves last known queue
   *   Given a visitor is viewing the Fissa page
   *   And the queue has loaded successfully
   *   When a refetch request fails due to a network error
   *   Then the previously loaded queue remains visible
   *   And the page does not crash or show an empty state
   */
  it("keeps the previously loaded queue visible when a poll fails with a network error", () => {
    // Simulate useQuery returning stale data alongside isError: true
    // (React Query preserves previous data on refetch failure)
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 5 },
          { trackId: "track-2", hasBeenPlayed: false, durationMs: 180000, score: 0, totalScore: 3 },
        ],
      },
      isLoading: false,
      isError: true,
      error: { message: "Network Error" },
    } as any);

    render(<QueuePage pin="ABC123" />);

    // Queue sections must still be visible (data is preserved)
    expect(screen.getByTestId("queue-now-playing")).toBeInTheDocument();
    expect(screen.getByTestId("queue-upcoming")).toBeInTheDocument();
    expect(screen.queryByTestId("fissa-not-found")).not.toBeInTheDocument();
  });
});

describe("/fissa/$pin — Upcoming tracks list (Task #61)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Queue is displayed in vote-ranked order
   *   Given the Fissa has multiple upcoming tracks
   *   Then the upcoming tracks list (track-list) is shown inside queue-upcoming
   *   And played tracks are not shown
   *   And the currently playing track is not shown
   */
  it("renders the track list when there are upcoming tracks", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 5 },
          { trackId: "track-2", hasBeenPlayed: false, durationMs: 180000, score: 0, totalScore: 3 },
          { trackId: "track-3", hasBeenPlayed: false, durationMs: 200000, score: 0, totalScore: 8 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("track-list")).toBeInTheDocument();
    expect(screen.queryByTestId("queue-empty")).not.toBeInTheDocument();
  });

  it("does not render the currently playing track in the upcoming list", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 5 },
          { trackId: "track-2", hasBeenPlayed: false, durationMs: 180000, score: 0, totalScore: 3 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    const items = screen.getAllByTestId("track-item");
    // only track-2 appears in the list (track-1 is currently playing)
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAttribute("data-trackid", "track-2");
  });

  it("does not render already-played tracks in the upcoming list", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 5 },
          { trackId: "track-2", hasBeenPlayed: true, durationMs: 180000, score: 0, totalScore: 3 },
          { trackId: "track-3", hasBeenPlayed: false, durationMs: 200000, score: 0, totalScore: 1 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    const items = screen.getAllByTestId("track-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAttribute("data-trackid", "track-3");
  });

  it("renders tracks sorted by totalScore descending in the queue", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: "track-1",
        tracks: [
          { trackId: "track-1", hasBeenPlayed: false, durationMs: 210000, score: 0, totalScore: 5 },
          { trackId: "track-low", hasBeenPlayed: false, durationMs: 180000, score: 0, totalScore: 1 },
          { trackId: "track-high", hasBeenPlayed: false, durationMs: 200000, score: 0, totalScore: 9 },
          { trackId: "track-mid", hasBeenPlayed: false, durationMs: 200000, score: 0, totalScore: 4 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    const items = screen.getAllByTestId("track-item");
    expect(items[0]).toHaveAttribute("data-trackid", "track-high");
    expect(items[1]).toHaveAttribute("data-trackid", "track-mid");
    expect(items[2]).toHaveAttribute("data-trackid", "track-low");
  });
});
