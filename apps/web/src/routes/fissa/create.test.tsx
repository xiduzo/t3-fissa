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
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

vi.mock("~/utils/api", () => ({
  api: {
    fissa: {
      create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
    spotify: {
      surpriseMe: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      getMyPlaylists: { useQuery: () => ({ data: [], isLoading: false }) },
      getPlaylistTracks: { useQuery: () => ({ data: [], isLoading: false }) },
      searchTracks: { useQuery: () => ({ data: undefined, isLoading: false }) },
    },
  },
}));

vi.mock("~/hooks/useTrackSearch", () => ({
  useTrackSearch: () => ({ query: "", setQuery: vi.fn(), results: [], isLoading: false }),
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { authClient } from "~/lib/auth-client";
import { CreateFissa } from "./create";
import { Hero } from "~/components/Hero";

// ── Tests — /fissa/create page ──────────────────────────────────────────────────

describe("/fissa/create — Create a Fissa page (Task #80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockResolvedValue(undefined);
  });

  /**
   * Scenario: Page renders the create fissa content
   */
  it("renders the create fissa page with data-testid", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByTestId("create-fissa-page")).toBeInTheDocument();
  });

  /**
   * Scenario: Authenticated user sees the creation page
   *   Given I am signed in
   *   Then I see the Create a Fissa heading
   */
  it("shows the Create a Fissa heading", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByText(/create a fissa/i)).toBeInTheDocument();
  });

  /**
   * Scenario: Unauthenticated user sees sign-in prompt on the create page
   *   Given I am not signed in
   *   When I visit /fissa/create
   *   Then I see a sign-in button
   */
  it("shows a sign-in button for unauthenticated users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<CreateFissa />);

    expect(screen.getByTestId("create-fissa-signin-btn")).toBeInTheDocument();
  });

  /**
   * Scenario: Unauthenticated user clicks sign-in — triggers Spotify OAuth
   */
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

  /**
   * Scenario: Authenticated user does NOT see the sign-in button
   */
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

  /**
   * Scenario: Signed-in user sees the Create a Fissa button on the home page
   *   Given I am signed in
   *   When I visit the home page
   *   Then I see a "Create a Fissa" button
   */
  it("renders a Create a Fissa button on the home page", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<Hero />);

    expect(screen.getByTestId("create-fissa-btn")).toBeInTheDocument();
    expect(screen.getByTestId("create-fissa-btn")).toHaveTextContent(/create a fissa/i);
  });

  /**
   * Scenario: Unauthenticated user sees the Create a Fissa button on the home page
   *   Given I am not signed in
   *   When I visit the home page
   *   Then I see a "Create a Fissa" button
   */
  it("renders a Create a Fissa button even when unauthenticated", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<Hero />);

    expect(screen.getByTestId("create-fissa-btn")).toBeInTheDocument();
  });

  /**
   * Scenario: Signed-in user clicks the CTA and is navigated to /fissa/create
   *   Given I am signed in as a Party Host
   *   When I click "Create a Fissa"
   *   Then I am navigated to /fissa/create
   */
  it("navigates authenticated user to /fissa/create on CTA click", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      isPending: false,
    } as any);

    render(<Hero />);

    fireEvent.click(screen.getByTestId("create-fissa-btn"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/fissa/create" });
  });

  /**
   * Scenario: Unauthenticated user clicks the CTA — triggers Spotify sign-in
   *   Given I am not signed in
   *   When I click "Create a Fissa"
   *   Then Spotify OAuth is triggered with callbackURL "/fissa/create"
   */
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

  /**
   * Scenario: Unauthenticated user is NOT auto-redirected — only on click
   */
  it("does not trigger sign-in automatically on render for unauthenticated users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any);

    render(<Hero />);

    expect(authClient.signIn.social).not.toHaveBeenCalled();
  });
});
