/**
 * Tests for AddTrackSheet component (Task #72)
 *
 * Scenario: Sheet is hidden when closed
 * Scenario: Sheet shows search input when open
 * Scenario: Loading state shown while searching
 * Scenario: Search results rendered when tracks returned
 * Scenario: Close button triggers onClose
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("~/hooks/useDebounce", () => ({
  useDebounce: (value: unknown) => value,
}));

const mockUseQuery = vi.fn();

vi.mock("~/utils/api", () => ({
  api: {
    spotify: {
      searchTracks: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { AddTrackSheet } from "./AddTrackSheet";

// ── Tests ──────────────────────────────────────────────────────────────────────

const noop = () => void 0;

describe("AddTrackSheet (Task #72)", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  /**
   * Scenario: Sheet is hidden when closed
   *   Given isOpen=false
   *   Then the sheet dialog is not in the document
   */
  it("renders nothing when isOpen is false", () => {
    const { container } = render(<AddTrackSheet isOpen={false} onClose={noop} pin="1234" />);
    expect(container.firstChild).toBeNull();
  });

  /**
   * Scenario: Sheet shows search input when open
   *   Given isOpen=true
   *   Then the search input is visible
   */
  it("renders the sheet dialog when isOpen is true", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);
    expect(screen.getByTestId("add-track-sheet")).toBeInTheDocument();
  });

  it("renders the search input when open", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);
    expect(screen.getByTestId("track-search-input")).toBeInTheDocument();
  });

  /**
   * Scenario: Close button triggers onClose
   *   Given isOpen=true
   *   When the close button is clicked
   *   Then onClose is called
   */
  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<AddTrackSheet isOpen={true} onClose={onClose} pin="1234" />);
    fireEvent.click(screen.getByTestId("add-track-sheet-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<AddTrackSheet isOpen={true} onClose={onClose} pin="1234" />);
    fireEvent.click(screen.getByRole("dialog").previousSibling as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  /**
   * Scenario: Loading state shown while searching
   *   Given a non-empty query is pending
   *   Then the loading indicator is visible
   */
  it("shows loading indicator when isLoading is true", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);
    expect(screen.getByTestId("track-search-loading")).toBeInTheDocument();
  });

  /**
   * Scenario: Search results rendered when tracks returned
   *   Given searchTracks returns two tracks
   *   Then each track name, artists, and artwork are displayed
   */
  it("renders search results when data is returned", () => {
    mockUseQuery.mockReturnValue({
      data: {
        tracks: [
          { id: "t1", name: "Song One", artists: ["Artist A"], albumArt: "https://img/t1.jpg" },
          { id: "t2", name: "Song Two", artists: ["Artist B", "Artist C"], albumArt: "https://img/t2.jpg" },
        ],
      },
      isLoading: false,
    });
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);

    expect(screen.getByTestId("track-search-results")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-t1")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-name-t1")).toHaveTextContent("Song One");
    expect(screen.getByTestId("search-result-artists-t1")).toHaveTextContent("Artist A");
    expect(screen.getByTestId("search-result-artwork-t1")).toHaveAttribute("src", "https://img/t1.jpg");

    expect(screen.getByTestId("search-result-t2")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-artists-t2")).toHaveTextContent("Artist B, Artist C");
  });

  it("does not render results list when data is empty", () => {
    mockUseQuery.mockReturnValue({ data: { tracks: [] }, isLoading: false });
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);
    expect(screen.queryByTestId("track-search-results")).not.toBeInTheDocument();
  });
});

describe("AddTrackSheet (Task #79)", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  /**
   * Scenario: Search returns no results
   *   Given the Add Track sheet is open
   *   When I type "xyzzy1234567890" and the search completes
   *   And Spotify returns zero results
   *   Then I see a "No tracks found" message
   *   And the search field remains usable
   */
  it("shows 'No tracks found' when search returns zero results", () => {
    mockUseQuery.mockReturnValue({ data: { tracks: [] }, isLoading: false });
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);

    const input = screen.getByTestId("track-search-input");
    fireEvent.change(input, { target: { value: "xyzzy1234567890" } });

    expect(screen.getByTestId("track-search-empty")).toBeInTheDocument();
    expect(screen.getByTestId("track-search-empty")).toHaveTextContent("No tracks found");
    expect(input).not.toBeDisabled();
  });

  /**
   * Scenario: Network error during track addition
   *   Given I have selected a track to add
   *   When the add mutation fails due to a network error
   *   Then I see an error message indicating the add failed
   *   And I see a retry button
   *   And the track is not silently dropped
   */
  it("shows error message and retry button when addError is true", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" addError={true} onRetry={noop} />);

    expect(screen.getByTestId("track-add-error")).toBeInTheDocument();
    expect(screen.getByTestId("track-add-retry-btn")).toBeInTheDocument();
  });

  /**
   * Scenario: Retrying after a network error
   *   Given an add-error state is shown
   *   When I tap the retry button
   *   Then the add mutation is attempted again with the same track
   */
  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" addError={true} onRetry={onRetry} />);

    fireEvent.click(screen.getByTestId("track-add-retry-btn"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  /**
   * Scenario: Fissa ends while guest is searching
   *   Given the Add Track sheet is open
   *   When the Fissa is detected as ended
   *   Then the sheet shows an ended-Fissa state
   *   And the search UI is no longer interactive
   */
  it("shows fissa-ended state and disables input when fissaEnded is true", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" fissaEnded={true} />);

    expect(screen.getByTestId("fissa-ended-state")).toBeInTheDocument();
    expect(screen.getByTestId("track-search-input")).toBeDisabled();
  });

  it("does not show add-error when fissaEnded is true", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" fissaEnded={true} addError={true} onRetry={noop} />);

    expect(screen.queryByTestId("track-add-error")).not.toBeInTheDocument();
  });
});
