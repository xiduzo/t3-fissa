/**
 * Tests for SpotifySignInButton component (Task #63)
 *
 * Scenario: Successful OAuth redirects to Fissa page
 * Scenario: Default redirect does not override callbackURL
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockSignInSocial = vi.fn();

vi.mock("~/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({ data: null, isPending: false }),
    signIn: {
      social: mockSignInSocial,
    },
  },
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { SpotifySignInButton } from "./SpotifySignInButton";

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("SpotifySignInButton — callbackURL flows to signIn.social (Task #63)", () => {
  /**
   * Scenario: Successful OAuth redirects to Fissa page
   *   Given a SpotifySignInButton with pin="1234"
   *   When the user clicks it
   *   Then authClient.signIn.social is called with callbackURL: "/fissa/1234"
   */
  it("calls signIn.social with callbackURL='/fissa/1234' when pin='1234'", () => {
    render(<SpotifySignInButton pin="1234" />);

    fireEvent.click(screen.getByTestId("spotify-signin-btn"));

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "spotify",
        callbackURL: "/fissa/1234",
      }),
    );
  });

  /**
   * Scenario: Default redirect does not override callbackURL
   *   Given a SpotifySignInButton with pin="1234"
   *   When the user clicks it
   *   Then callbackURL is "/fissa/1234" — not the homepage "/" or any other default
   */
  it("does not call signIn.social with callbackURL='/' (homepage default)", () => {
    render(<SpotifySignInButton pin="1234" />);

    fireEvent.click(screen.getByTestId("spotify-signin-btn"));

    expect(mockSignInSocial).not.toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: "/" }),
    );
    expect(mockSignInSocial).not.toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: "" }),
    );
  });

  /**
   * Scenario: Different pin produces different callbackURL
   *   Given a SpotifySignInButton with pin="9999"
   *   When the user clicks it
   *   Then callbackURL is "/fissa/9999"
   */
  it("calls signIn.social with callbackURL='/fissa/9999' when pin='9999'", () => {
    render(<SpotifySignInButton pin="9999" />);

    fireEvent.click(screen.getByTestId("spotify-signin-btn"));

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "spotify",
        callbackURL: "/fissa/9999",
      }),
    );
  });
});
