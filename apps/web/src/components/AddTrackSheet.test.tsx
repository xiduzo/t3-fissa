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
