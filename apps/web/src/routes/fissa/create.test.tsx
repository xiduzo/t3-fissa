/**
 * Tests for /fissa/create page and home page CTA (Task #80)
 *
 * Scenario: Signed-in user sees and clicks the Create a Fissa CTA
 *   Given I am signed in as a Party Host
 *   When I visit the web app home page
 *   Then I see a "Create a Fissa" button
 *   When I click it
 *   Then I am navigated to the Fissa creation page
 *
 * Scenario: Unauthenticated user sees sign-in prompt on CTA click
 *   Given I am not signed in
 *   When I visit the web app home page
 *   Then I see a "Create a Fissa" button
 *   When I click it
 *   Then I see a sign-in prompt (or I am redirected to sign in)
 *
 * Tests for Task #82: Spotify Track search and multi-select UI
 *
 * Scenario: Host searches for and selects seed tracks
 *   Given I am on the Fissa creation page
 *   When I type "Daft Punk" in the track search input
 *   Then I see a list of Spotify tracks matching "Daft Punk"
 *   When I click a track to select it
 *   Then the track appears in my selected tracks summary
 *   And the track is visually marked as selected in the results list
 *
 * Scenario: Host tries to submit without enough seed tracks
 *   Given I am on the Fissa creation page
 *   And I have selected fewer tracks than the minimum required
 *   Then the submit button is disabled
 *   And a message indicates how many more tracks are needed
 *
 * Scenario: Host meets the minimum track count
 *   Given I have selected the minimum required number of tracks
 *   Then the submit button becomes enabled
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({ component: null }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock("~/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({ data: null, isPending: false }),
    signIn: {
      social: vi.fn(),
    },
  },
}));

vi.mock("~/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: { 500: "#ff0", 100: "#fff", 900: "#000" } }),
}));

vi.mock("~/components/AppDemo", () => ({
  AppDemo: () => <div data-testid="app-demo" />,
}));

vi.mock("~/components/AppStoreLink", () => ({
  AppStoreLink: () => <a href="#app-store">App Store</a>,
}));

vi.mock("~/components/PlayStoreLink", () => ({
  PlayStoreLink: () => <a href="#play-store">Play Store</a>,
}));

vi.mock("~/components/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("~/components/PhoneFrame", () => ({
  PhoneFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the tRPC API
vi.mock("~/utils/api", () => ({
  api: {
    spotify: {
      searchTracks: {
        useQuery: vi.fn(),
      },
    },
    fissa: {
      create: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { authClient } from "~/lib/auth-client";
import { CreateFissa } from "./create";
import { Hero } from "~/components/Hero";
import { api } from "~/utils/api";

// ── Tests — /fissa/create page ──────────────────────────────────────────────────

describe("/fissa/create — Create a Fissa page (Task #80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockResolvedValue(undefined);
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    vi.mocked(api.fissa.create.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it("renders the create fissa page with data-testid", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByTestId("create-fissa-page")).toBeInTheDocument();
  });

  it("shows the Create a Fissa heading", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByText(/create a fissa/i)).toBeInTheDocument();
  });

  it("shows a sign-in button for unauthenticated users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByTestId("create-fissa-signin-btn")).toBeInTheDocument();
  });

  it("triggers Spotify OAuth when unauthenticated user clicks sign-in", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("create-fissa-signin-btn"));

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "spotify",
      callbackURL: "/fissa/create",
    });
  });

  it("does not show sign-in button for authenticated users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.queryByTestId("create-fissa-signin-btn")).not.toBeInTheDocument();
  });
});

// ── Tests — Home page Create a Fissa CTA ──────────────────────────────────────

describe("Home page — Create a Fissa CTA (Task #80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockResolvedValue(undefined);
  });

  it("renders a Create a Fissa button on the home page", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<Hero />);

    expect(screen.getByTestId("create-fissa-btn")).toBeInTheDocument();
    expect(screen.getByTestId("create-fissa-btn")).toHaveTextContent(/create a fissa/i);
  });

  it("renders a Create a Fissa button even when unauthenticated", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<Hero />);

    expect(screen.getByTestId("create-fissa-btn")).toBeInTheDocument();
  });

  it("navigates authenticated user to /fissa/create on CTA click", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<Hero />);

    fireEvent.click(screen.getByTestId("create-fissa-btn"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/fissa/create" });
  });

  it("triggers Spotify OAuth for unauthenticated user clicking the CTA", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<Hero />);

    fireEvent.click(screen.getByTestId("create-fissa-btn"));

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "spotify",
      callbackURL: "/fissa/create",
    });
  });

  it("does not trigger sign-in automatically on render for unauthenticated users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<Hero />);

    expect(authClient.signIn.social).not.toHaveBeenCalled();
  });
});

// ── Tests — Track Search UI (Task #82) ────────────────────────────────────────

describe("CreateFissa — Track search UI (Task #82)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockResolvedValue(undefined);

    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    vi.mocked(api.fissa.create.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it("shows the track search input for authenticated users", () => {
    render(<CreateFissa />);

    expect(screen.getByTestId("track-search-input")).toBeInTheDocument();
  });

  it("renders search results when tracks are returned", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk"], albumArt: "https://example.com/art1.jpg" },
          { id: "track-2", name: "One More Time", artists: ["Daft Punk"], albumArt: "https://example.com/art2.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByTestId("track-search-results")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^search-result-track-/)).toHaveLength(2);
  });

  it("shows track name, artist, and artwork in each result", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk", "Pharrell Williams"], albumArt: "https://example.com/art1.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    render(<CreateFissa />);

    const result = screen.getByTestId("search-result-track-1");
    expect(result).toBeInTheDocument();
    expect(screen.getByTestId("search-result-name-track-1")).toHaveTextContent("Get Lucky");
    expect(screen.getByTestId("search-result-artists-track-1")).toHaveTextContent("Daft Punk");
    expect(screen.getByTestId("search-result-artwork-track-1")).toBeInTheDocument();
  });

  it("adds track to selected summary when clicked", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk"], albumArt: "https://example.com/art1.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("search-result-track-1"));

    expect(screen.getByTestId("selected-tracks-summary")).toBeInTheDocument();
    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
  });

  it("marks track result as selected (aria-pressed) when clicked", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk"], albumArt: "https://example.com/art1.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    render(<CreateFissa />);

    const resultItem = screen.getByTestId("search-result-track-1");
    expect(resultItem).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(resultItem);

    expect(resultItem).toHaveAttribute("aria-pressed", "true");
  });

  it("deselects a track when clicking it again", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk"], albumArt: "https://example.com/art1.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("search-result-track-1"));
    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");

    fireEvent.click(screen.getByTestId("search-result-track-1"));
    expect(screen.queryByTestId("selected-count")).not.toBeInTheDocument();
  });

  it("disables the submit button when no tracks are selected", () => {
    render(<CreateFissa />);

    const submitBtn = screen.getByTestId("create-fissa-submit-btn");
    expect(submitBtn).toBeDisabled();
  });

  it("shows how many more tracks are needed when below minimum", () => {
    render(<CreateFissa />);

    expect(screen.getByTestId("tracks-needed-message")).toBeInTheDocument();
  });

  it("enables the submit button when minimum track count is met", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk"], albumArt: "https://example.com/art1.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("search-result-track-1"));

    const submitBtn = screen.getByTestId("create-fissa-submit-btn");
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows empty state when search returns no tracks", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: { tracks: [] },
      isLoading: false,
    } as any);

    render(<CreateFissa />);

    fireEvent.change(screen.getByTestId("track-search-input"), { target: { value: "Daft Punk" } });

    expect(screen.getByTestId("track-search-empty")).toBeInTheDocument();
  });

  it("shows loading state while search is in progress", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByTestId("track-search-loading")).toBeInTheDocument();
  });

  it("preserves selected tracks when search results change", () => {
    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk"], albumArt: "https://example.com/art1.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    const { rerender } = render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("search-result-track-1"));
    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");

    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-2", name: "Lose Yourself", artists: ["Eminem"], albumArt: "https://example.com/art2.jpg" },
        ],
      },
      isLoading: false,
    } as any);

    rerender(<CreateFissa />);

    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
  });
});

// ── Tests — fissa.create mutation wiring (Task #83) ──────────────────────────

/**
 * Scenario: Host submits the creation form successfully
 *   Given I am on the Fissa creation page
 *   And I have selected the minimum required number of tracks
 *   When I click the "Create Fissa" button
 *   Then the fissa.create mutation is called with my selected track IDs and durationMs
 *
 * Scenario: Mutation is in-flight
 *   Given I have clicked "Create Fissa"
 *   Then the submit button is disabled
 *   And a loading spinner is visible
 *
 * Scenario: Mutation returns an error
 *   Given I have clicked "Create Fissa"
 *   When the server returns an error
 *   Then the error is surfaced via the error element
 */
describe("CreateFissa — fissa.create mutation wiring (Task #83)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockResolvedValue(undefined);

    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    vi.mocked(api.spotify.searchTracks.useQuery).mockReturnValue({
      data: {
        tracks: [
          { id: "track-1", name: "Get Lucky", artists: ["Daft Punk"], albumArt: "https://example.com/art1.jpg", durationMs: 247000 },
        ],
      },
      isLoading: false,
    } as any);

    vi.mocked(api.fissa.create.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it("calls fissa.create mutation with selected tracks when submit is clicked", () => {
    const mockMutate = vi.fn();
    vi.mocked(api.fissa.create.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("search-result-track-1"));
    fireEvent.click(screen.getByTestId("create-fissa-submit-btn"));

    expect(mockMutate).toHaveBeenCalledWith([
      { trackId: "track-1", durationMs: 247000 },
    ]);
  });

  it("disables the submit button and shows loading indicator while mutation is in-flight", () => {
    vi.mocked(api.fissa.create.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("search-result-track-1"));

    const submitBtn = screen.getByTestId("create-fissa-submit-btn");
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId("create-fissa-loading")).toBeInTheDocument();
  });

  it("surfaces mutation error via error element when server returns an error", () => {
    let capturedOnError: ((err: { message: string }) => void) | undefined;

    vi.mocked(api.fissa.create.useMutation).mockImplementation((opts: any) => {
      capturedOnError = opts?.onError;
      return { mutate: vi.fn(), isPending: false } as any;
    });

    render(<CreateFissa />);

    fireEvent.click(screen.getByTestId("search-result-track-1"));
    fireEvent.click(screen.getByTestId("create-fissa-submit-btn"));

    act(() => {
      capturedOnError?.({ message: "Something went wrong" });
    });

    expect(screen.getByTestId("create-fissa-error")).toHaveTextContent("Something went wrong");
  });
});
