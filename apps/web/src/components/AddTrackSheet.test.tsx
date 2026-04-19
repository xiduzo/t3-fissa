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

const mockUseTrackSearch = vi.fn();

vi.mock("~/hooks/useTrackSearch", () => ({
  useTrackSearch: () => mockUseTrackSearch(),
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { AddTrackSheet } from "./AddTrackSheet";

// ── Tests ──────────────────────────────────────────────────────────────────────

const noop = () => void 0;

describe("AddTrackSheet (Task #72)", () => {
  beforeEach(() => {
    mockUseTrackSearch.mockReturnValue({ results: [], isLoading: false, query: "", setQuery: vi.fn() });
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
    mockUseTrackSearch.mockReturnValue({ results: [], isLoading: true, query: "Bohemian", setQuery: vi.fn() });
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);
    expect(screen.getByTestId("track-search-loading")).toBeInTheDocument();
  });

  /**
   * Scenario: Search results rendered when tracks returned
   *   Given searchTracks returns two tracks
   *   Then each track name, artists, and artwork are displayed
   */
  it("renders search results when data is returned", () => {
    mockUseTrackSearch.mockReturnValue({
      results: [
        { id: "t1", name: "Song One", durationMs: 180000, artists: ["Artist A"], albumArt: "https://img/t1.jpg" },
        { id: "t2", name: "Song Two", durationMs: 240000, artists: ["Artist B", "Artist C"], albumArt: "https://img/t2.jpg" },
      ],
      isLoading: false,
      query: "Song",
      setQuery: vi.fn(),
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
    mockUseTrackSearch.mockReturnValue({ results: [], isLoading: false, query: "", setQuery: vi.fn() });
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);
    expect(screen.queryByTestId("track-search-results")).not.toBeInTheDocument();
  });
});

// ── Task #74 Tests ─────────────────────────────────────────────────────────────

const tracks = [
  { id: "t1", name: "Song One", durationMs: 180000, artists: ["Artist A"], albumArt: "https://img/t1.jpg" },
  { id: "t2", name: "Song Two", durationMs: 240000, artists: ["Artist B", "Artist C"], albumArt: "" },
];

describe("AddTrackSheet (Task #74)", () => {
  beforeEach(() => {
    mockUseTrackSearch.mockReturnValue({
      results: tracks,
      isLoading: false,
      query: "Song",
      setQuery: vi.fn(),
    });
  });

  /**
   * Scenario: Search result shows artwork, title, and artist
   *   Given search results are loaded
   *   Then each result item shows an album artwork thumbnail
   *   And each result item shows the track title
   *   And each result item shows the artist name
   */
  it("shows artwork, title, and artist for each result", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);

    expect(screen.getByTestId("search-result-artwork-t1")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-name-t1")).toHaveTextContent("Song One");
    expect(screen.getByTestId("search-result-artists-t1")).toHaveTextContent("Artist A");

    expect(screen.getByTestId("search-result-name-t2")).toHaveTextContent("Song Two");
    expect(screen.getByTestId("search-result-artists-t2")).toHaveTextContent("Artist B, Artist C");
  });

  /**
   * Scenario: Artwork fallback when no image is available
   *   Given a search result has no artwork URL
   *   Then a placeholder image is shown instead
   */
  it("shows a placeholder when albumArt is empty", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);

    // t1 has artwork — img element expected
    const t1Artwork = screen.getByTestId("search-result-artwork-t1");
    expect(t1Artwork.tagName).toBe("IMG");

    // t2 has no artwork — placeholder div expected (no img src)
    const t2Artwork = screen.getByTestId("search-result-artwork-t2");
    expect(t2Artwork.tagName).not.toBe("IMG");
    expect(t2Artwork).toBeInTheDocument();
  });

  /**
   * Scenario: Selecting a result via click
   *   Given search results are displayed
   *   When I click a track result item
   *   Then the onSelect callback is called with that track
   */
  it("calls onSelect with the track when a result is clicked", () => {
    const onSelect = vi.fn();
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("search-result-t1"));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(tracks[0]);
  });

  /**
   * Scenario: Selecting a result via keyboard
   *   Given search results are displayed and focused
   *   When I press Enter on a track result item
   *   Then the onSelect callback is called with that track
   */
  it("calls onSelect with the track when Enter is pressed on a result", () => {
    const onSelect = vi.fn();
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" onSelect={onSelect} />);

    fireEvent.keyDown(screen.getByTestId("search-result-t1"), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(tracks[0]);
  });

  it("calls onSelect with the track when Space is pressed on a result", () => {
    const onSelect = vi.fn();
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" onSelect={onSelect} />);

    fireEvent.keyDown(screen.getByTestId("search-result-t1"), { key: " " });
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(tracks[0]);
  });
});

// ── Task #77 Tests ─────────────────────────────────────────────────────────────

describe("AddTrackSheet — duplicate track feedback (Task #77)", () => {
  beforeEach(() => {
    mockUseTrackSearch.mockReturnValue({
      results: tracks,
      isLoading: false,
      query: "Bohemian",
      setQuery: vi.fn(),
    });
  });

  /**
   * Scenario: Adding a track that is already in the Queue
   *   Given the Add Track sheet is open
   *   When duplicateTrack=true is passed
   *   Then I see an inline message "This track is already in the Queue"
   *   And the sheet remains open
   */
  it("shows inline duplicate feedback when duplicateTrack prop is true", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" duplicateTrack={true} />);
    expect(screen.getByTestId("track-duplicate-error")).toBeInTheDocument();
    expect(screen.getByTestId("track-duplicate-error")).toHaveTextContent(/already in the queue/i);
  });

  it("does not show duplicate feedback when duplicateTrack is false", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" duplicateTrack={false} />);
    expect(screen.queryByTestId("track-duplicate-error")).not.toBeInTheDocument();
  });

  it("does not show duplicate feedback when duplicateTrack is not provided", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" />);
    expect(screen.queryByTestId("track-duplicate-error")).not.toBeInTheDocument();
  });

  /**
   * Scenario: Sheet stays open on duplicate error
   *   The sheet must NOT close when duplicateTrack is set
   */
  it("sheet remains open when duplicateTrack is true", () => {
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" duplicateTrack={true} />);
    expect(screen.getByTestId("add-track-sheet")).toBeInTheDocument();
  });

  /**
   * Scenario: Selecting a different track after duplicate feedback
   *   Given duplicate feedback is shown
   *   When I click a track result
   *   Then onSelect is still called (so the parent can clear duplicate state)
   */
  it("calls onSelect when a track is clicked even when duplicateTrack is true", () => {
    const onSelect = vi.fn();
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" onSelect={onSelect} duplicateTrack={true} />);
    fireEvent.click(screen.getByTestId("search-result-t1"));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(tracks[0]);
  });

  /**
   * Scenario: Clearing duplicate feedback on new search
   *   Given duplicate feedback is shown
   *   When I type in the search field
   *   Then onClearDuplicate is called so the parent can clear the state
   */
  it("calls onClearDuplicate when user types in search input", () => {
    const onClearDuplicate = vi.fn();
    mockUseTrackSearch.mockReturnValue({
      results: [],
      isLoading: false,
      query: "Bohemian",
      setQuery: vi.fn(),
    });
    render(<AddTrackSheet isOpen={true} onClose={noop} pin="1234" duplicateTrack={true} onClearDuplicate={onClearDuplicate} />);
    fireEvent.change(screen.getByTestId("track-search-input"), { target: { value: "Queen" } });
    expect(onClearDuplicate).toHaveBeenCalled();
  });
});
