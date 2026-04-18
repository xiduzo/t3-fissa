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
