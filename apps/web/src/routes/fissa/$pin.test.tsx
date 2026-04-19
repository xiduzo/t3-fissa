/**
 * Tests for /fissa/$pin page (Task #57, #58)
 *
 * Scenario: Fissa page renders layout without automatic redirect
 * Scenario: Visitor with native app installed is not auto-redirected
 * Scenario: Unauthenticated visitor sees Sign in CTA (Task #58)
 * Scenario: Authenticated user does not see Sign in CTA (Task #58)
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
    vote: {
      byFissaFromUser: {
        useQuery: vi.fn().mockReturnValue({
          data: undefined,
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

vi.mock("~/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({ data: null, isPending: false }),
    signIn: {
      social: vi.fn(),
    },
  },
}));

vi.mock("~/components/SpotifySignInButton", () => ({
  SpotifySignInButton: ({ pin }: { pin: string }) => (
    <button data-testid="spotify-signin-btn" data-pin={pin}>
      Sign in with Spotify
    </button>
  ),
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { api } from "~/utils/api";
import { authClient } from "~/lib/auth-client";
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

describe("/fissa/$pin — No auto deep-link redirect on page load (Task #81)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    // Reset window.location to a clean state
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost/fissa/ABC123",
        replace: vi.fn(),
        assign: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Fissa page loads without auto-redirect
   *   Given a guest navigates to /fissa/<pin>
   *   When page finishes loading
   *   Then browser remains on /fissa/<pin>
   *   AND no deep-link redirect is triggered automatically
   */
  it("does not call window.location.replace on mount (no deep-link redirect)", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("does not call window.location.href with a deep-link scheme on mount", () => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="ABC123" />);

    // href must stay on the page URL — never set to a deep-link
    expect(window.location.href).not.toMatch(/^com\.fissa:\/\//);
    expect(window.location.replace).not.toHaveBeenCalledWith(
      expect.stringMatching(/^com\.fissa:\/\//),
    );
  });

  /**
   * Scenario: Fissa page loads when native app is installed
   *   Given a guest navigates to /fissa/<pin>
   *   And the native app is installed
   *   When page finishes loading
   *   Then browser still remains on /fissa/<pin>
   *   AND app is not launched automatically
   */
  it("does not redirect even when fissa data loads successfully (app installed simulation)", () => {
    // Simulate query succeeding (as if native app is installed, data returns)
    mockUseQuery.mockImplementation(
      (_pin: string, options?: { onSuccess?: (data: unknown) => void }) => {
        // Call onSuccess if it exists — prior code had redirect in onSuccess
        options?.onSuccess?.({ pin: "ABC123" });
        return {
          data: { pin: "ABC123", currentlyPlayingId: null, tracks: [] },
          isLoading: false,
          isError: false,
          error: null,
        } as any;
      },
    );

    render(<QueuePage pin="ABC123" />);

    expect(window.location.replace).not.toHaveBeenCalled();
    expect(window.location.assign).not.toHaveBeenCalled();
    // href must not have been redirected to a native deep-link
    expect(window.location.href).not.toMatch(/^com\.fissa:\/\//);
  });

  it("does not redirect to any deep-link scheme regardless of query state", () => {
    // Test with multiple query states to ensure no state triggers a redirect
    const states = [
      { data: undefined, isLoading: true, isError: false, error: null },
      { data: { pin: "ABC123", tracks: [] }, isLoading: false, isError: false, error: null },
      { data: undefined, isLoading: false, isError: true, error: { message: "Not found" } },
    ];

    for (const state of states) {
      // Reset replace mock between renders
      const replaceSpy = vi.fn();
      Object.defineProperty(window, "location", {
        value: { href: "http://localhost/fissa/ABC123", replace: replaceSpy, assign: vi.fn() },
        writable: true,
        configurable: true,
      });

      mockUseQuery.mockReturnValue(state as any);
      const { unmount } = render(<QueuePage pin="ABC123" />);

      expect(replaceSpy).not.toHaveBeenCalled();
      unmount();
    }
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

describe("/fissa/$pin — Sign in with Spotify CTA (Task #58)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);
  const mockUseSession = vi.mocked(authClient.useSession);

  const activeFissaData = {
    pin: "ABC123",
    currentlyPlayingId: null,
    tracks: [],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: activeFissaData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Unauthenticated visitor sees Sign in CTA
   *   Given visitor is not signed in
   *   When they navigate to /fissa/<pin>
   *   Then they see a "Sign in with Spotify" button
   *   AND the Queue view is also visible
   */
  it("shows the Sign in with Spotify button when the visitor is unauthenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("spotify-signin-btn")).toBeInTheDocument();
  });

  it("shows the queue sections alongside the sign-in CTA when unauthenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("queue-now-playing")).toBeInTheDocument();
    expect(screen.getByTestId("queue-signin-cta")).toBeInTheDocument();
    expect(screen.getByTestId("spotify-signin-btn")).toBeInTheDocument();
  });

  /**
   * Scenario: Authenticated user does not see Sign in CTA
   *   Given visitor is signed in with Spotify
   *   When they navigate to /fissa/<pin>
   *   Then the "Sign in with Spotify" button is not visible
   */
  it("does not show the Sign in with Spotify button when the visitor is authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user1", name: "Test" } },
      isPending: false,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("spotify-signin-btn")).not.toBeInTheDocument();
  });

  /**
   * Scenario: Session is loading — suppress CTA to avoid flash
   *   Given session is still being determined (isPending: true)
   *   Then the Sign in button is NOT shown yet
   */
  it("does not show the Sign in button while session is loading (isPending)", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.queryByTestId("spotify-signin-btn")).not.toBeInTheDocument();
  });
});

describe("/fissa/$pin — OAuth callbackURL (Task #60)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);
  const mockUseSession = vi.mocked(authClient.useSession);

  const activeFissaData = {
    pin: "1234",
    currentlyPlayingId: null,
    tracks: [],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: activeFissaData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    mockUseSession.mockReturnValue({ data: null, isPending: false } as any);
  });

  /**
   * Scenario: Sign-in is initiated with correct callbackURL
   *   Given an unauthenticated visitor on /fissa/1234
   *   Then SpotifySignInButton receives pin="1234" so it can build callbackURL: "/fissa/1234"
   */
  it("passes pin='1234' to SpotifySignInButton so callbackURL resolves to /fissa/1234", () => {
    render(<QueuePage pin="1234" />);

    const btn = screen.getByTestId("spotify-signin-btn");
    expect(btn).toHaveAttribute("data-pin", "1234");
  });

  /**
   * Scenario: callbackURL includes the correct PIN from route params
   *   Given an unauthenticated visitor on /fissa/9999
   *   When they click "Sign in with Spotify"
   *   Then signIn.social is called with callbackURL: "/fissa/9999"
   */
  it("passes pin='9999' to SpotifySignInButton so callbackURL resolves to /fissa/9999", () => {
    mockUseQuery.mockReturnValue({
      data: { ...activeFissaData, pin: "9999" },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="9999" />);

    const btn = screen.getByTestId("spotify-signin-btn");
    expect(btn).toHaveAttribute("data-pin", "9999");
  });
});

describe("/fissa/$pin — Queue interaction controls (Task #66)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);
  const mockUseSession = vi.mocked(authClient.useSession);

  const activeFissaData = {
    pin: "1234",
    currentlyPlayingId: null,
    tracks: [],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: activeFissaData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Authenticated guest sees interaction controls
   *   Given a visitor who is signed in with Spotify
   *   When they navigate to /fissa/<pin>
   *   Then they see an "Add Track" button and vote controls
   */
  it("shows Add Track button and vote controls when the visitor is authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<QueuePage pin="1234" />);

    expect(screen.getByTestId("add-track-btn")).toBeInTheDocument();
    expect(screen.getByTestId("vote-controls")).toBeInTheDocument();
  });

  /**
   * Scenario: Unauthenticated visitor does not see interaction controls
   *   Given a visitor who is not signed in
   *   When they navigate to /fissa/<pin>
   *   Then they do NOT see the Add Track button or vote controls
   */
  it("does not show Add Track button or vote controls when the visitor is unauthenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false } as any);

    render(<QueuePage pin="1234" />);

    expect(screen.queryByTestId("add-track-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote-controls")).not.toBeInTheDocument();
  });

  /**
   * Scenario: Controls become visible after sign-in without page reload
   *   Given a visitor who starts unauthenticated
   *   When the session updates to authenticated
   *   Then the controls appear without a page reload
   */
  it("controls appear after sign-in (session update without page reload)", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false } as any);

    const { rerender } = render(<QueuePage pin="1234" />);

    expect(screen.queryByTestId("add-track-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote-controls")).not.toBeInTheDocument();

    // Simulate session becoming available (user signs in)
    mockUseSession.mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    rerender(<QueuePage pin="1234" />);

    expect(screen.getByTestId("add-track-btn")).toBeInTheDocument();
    expect(screen.getByTestId("vote-controls")).toBeInTheDocument();
  });
});

describe("/fissa/$pin — OAuth error handling (Task #67)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);
  const mockUseSession = vi.mocked(authClient.useSession);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { pin: "1234" }, isLoading: false, error: null } as any);
    mockUseSession.mockReturnValue({ data: null, isPending: false } as any);
  });

  it("shows error banner when error prop is present", () => {
    render(<QueuePage pin="1234" error="access_denied" />);
    expect(screen.getByTestId("oauth-error-banner")).toBeInTheDocument();
    expect(screen.getByText(/Sign-in was cancelled or failed/)).toBeInTheDocument();
  });

  it("does not show error banner when no error prop", () => {
    render(<QueuePage pin="1234" />);
    expect(screen.queryByTestId("oauth-error-banner")).not.toBeInTheDocument();
  });

  it("sign-in button remains visible alongside the error banner", () => {
    render(<QueuePage pin="1234" error="access_denied" />);
    expect(screen.getByTestId("oauth-error-banner")).toBeInTheDocument();
    expect(screen.getByTestId("spotify-signin-btn")).toBeInTheDocument();
  });

  it("dismiss button is present in the error banner", () => {
    render(<QueuePage pin="1234" error="access_denied" />);
    expect(screen.getByTestId("dismiss-error-btn")).toBeInTheDocument();
  });

  it("does not auto-trigger OAuth when error param is present", () => {
    const mockSignIn = vi.mocked(authClient.signIn.social);
    render(<QueuePage pin="1234" error="access_denied" />);
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});

describe("/fissa/$pin — Open in mobile app CTA (Task #84)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Deep link href contains correct pin
   *   Given a Fissa page with pin "ABC123"
   *   Then there is an anchor with href="com.fissa://fissa/ABC123"
   */
  it("renders an anchor with the correct com.fissa deep-link href", () => {
    render(<QueuePage pin="ABC123" />);

    const cta = screen.getByTestId("open-mobile-app-cta");
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "com.fissa://fissa/ABC123");
  });

  /**
   * Scenario: "Open in mobile app" CTA is visible on the page
   */
  it("shows 'Open in mobile app' text on the CTA", () => {
    render(<QueuePage pin="ABC123" />);

    expect(screen.getByText(/open in mobile app/i)).toBeInTheDocument();
  });

  /**
   * Scenario: Guest taps without app installed — browser stays on page
   *   The element must be a plain <a> tag (not a button), so the browser
   *   handles the deep-link natively without JS navigation.
   */
  it("uses a plain <a> element (not a button) so the browser handles deep-link gracefully", () => {
    render(<QueuePage pin="ABC123" />);

    const cta = screen.getByTestId("open-mobile-app-cta");
    expect(cta.tagName.toLowerCase()).toBe("a");
  });

  /**
   * Deep link href is pin-specific — different pin produces different href
   */
  it("uses the pin prop in the deep-link href", () => {
    mockUseQuery.mockReturnValue({
      data: { pin: "XYZ999", currentlyPlayingId: null, tracks: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QueuePage pin="XYZ999" />);

    const cta = screen.getByTestId("open-mobile-app-cta");
    expect(cta).toHaveAttribute("href", "com.fissa://fissa/XYZ999");
  });
});

describe("/fissa/$pin — Open in desktop app placeholder CTA (Task #87)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: "Open in desktop app" CTA is visible on the Fissa page
   */
  it("renders the 'Open in desktop app' CTA on the page", () => {
    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("open-desktop-app-cta")).toBeInTheDocument();
    expect(screen.getByText(/open in desktop app/i)).toBeInTheDocument();
  });

  /**
   * Scenario: "Open in desktop app" CTA does not break the browser session
   *   CTA href is "#" so clicking does not trigger navigation
   */
  it("has href='#' on the desktop app CTA to prevent navigation", () => {
    render(<QueuePage pin="ABC123" />);

    const cta = screen.getByTestId("open-desktop-app-cta");
    expect(cta).toHaveAttribute("href", "#");
  });

  /**
   * Scenario: Desktop scheme is N/A — CTA is a placeholder (anchor element)
   */
  it("is rendered as an anchor element (placeholder for future desktop scheme)", () => {
    render(<QueuePage pin="ABC123" />);

    const cta = screen.getByTestId("open-desktop-app-cta");
    expect(cta.tagName.toLowerCase()).toBe("a");
  });
});

describe("/fissa/$pin — App-open CTAs visually secondary (Task #89)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: {
        pin: "ABC123",
        currentlyPlayingId: null,
        tracks: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  /**
   * Scenario: Both app-open CTAs are present in the document
   */
  it("renders both app-open CTAs in the document", () => {
    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("open-mobile-app-cta")).toBeInTheDocument();
    expect(screen.getByTestId("open-desktop-app-cta")).toBeInTheDocument();
  });

  /**
   * Scenario: Both CTAs share consistent styling
   *   Both CTAs must have the same className to ensure visual consistency
   */
  it("applies identical className to both app-open CTAs for visual consistency", () => {
    render(<QueuePage pin="ABC123" />);

    const mobileCta = screen.getByTestId("open-mobile-app-cta");
    const desktopCta = screen.getByTestId("open-desktop-app-cta");

    expect(mobileCta.className).toBe(desktopCta.className);
  });
});

describe("/fissa/$pin — Fetch existing votes on load (Task #69)", () => {
  const mockUseQuery = vi.mocked(api.fissa.byId.useQuery);
  const mockVoteByFissaFromUser = vi.mocked(api.vote.byFissaFromUser.useQuery);
  const mockUseSession = vi.mocked(authClient.useSession);

  const activeFissaData = {
    pin: "ABC123",
    currentlyPlayingId: null,
    tracks: [
      { trackId: "track-123", hasBeenPlayed: false, durationMs: 180000, score: 0, totalScore: 3 },
      { trackId: "track-456", hasBeenPlayed: false, durationMs: 180000, score: 0, totalScore: 1 },
    ],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: activeFissaData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    mockVoteByFissaFromUser.mockReturnValue({ data: undefined } as any);
  });

  /**
   * Scenario: Guest's previously cast upvote is shown on load
   *   Given I am signed in as a Party Guest
   *   And I previously upvoted track "track-123"
   *   When I load the Fissa page
   *   Then the upvote button for "track-123" shows as active/selected
   */
  it("calls vote.byFissaFromUser with { pin } when user is authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user1", name: "Test" } },
      isPending: false,
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(mockVoteByFissaFromUser).toHaveBeenCalledWith(
      { pin: "ABC123" },
      expect.objectContaining({ enabled: true }),
    );
  });

  it("does not call vote.byFissaFromUser when user is unauthenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false } as any);

    render(<QueuePage pin="ABC123" />);

    expect(mockVoteByFissaFromUser).toHaveBeenCalledWith(
      { pin: "ABC123" },
      expect.objectContaining({ enabled: false }),
    );
  });

  it("shows upvote button as aria-pressed=true for a previously upvoted track", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user1", name: "Test" } },
      isPending: false,
    } as any);
    mockVoteByFissaFromUser.mockReturnValue({
      data: [{ trackId: "track-123", score: 1 }],
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("upvote-track-123")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("downvote-track-123")).toHaveAttribute("aria-pressed", "false");
  });

  it("shows downvote button as aria-pressed=true for a previously downvoted track", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user1", name: "Test" } },
      isPending: false,
    } as any);
    mockVoteByFissaFromUser.mockReturnValue({
      data: [{ trackId: "track-456", score: -1 }],
    } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("upvote-track-456")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("downvote-track-456")).toHaveAttribute("aria-pressed", "true");
  });

  it("shows both vote buttons as aria-pressed=false for unvoted tracks", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "user1", name: "Test" } },
      isPending: false,
    } as any);
    mockVoteByFissaFromUser.mockReturnValue({ data: [] } as any);

    render(<QueuePage pin="ABC123" />);

    expect(screen.getByTestId("upvote-track-123")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("downvote-track-123")).toHaveAttribute("aria-pressed", "false");
  });
});
