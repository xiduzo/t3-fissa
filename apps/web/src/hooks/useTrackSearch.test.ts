/**
 * Tests for useTrackSearch hook (Task #72)
 *
 * Scenario: Typing triggers a debounced search
 * Scenario: Empty query does not trigger search
 * Scenario: Loading state is shown during search
 * Scenario: Results populate after search completes
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Mock useDebounce to pass values through synchronously in tests
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

// ── Import after mocks ────────────────────────────────────────────────────────

import { useTrackSearch } from "./useTrackSearch";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useTrackSearch (Task #72)", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  /**
   * Scenario: Empty query does not trigger search
   *   Given the search field is empty
   *   Then no Spotify search is performed (enabled=false)
   */
  it("does not enable the query when query is empty", () => {
    renderHook(() => useTrackSearch());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );
  });

  /**
   * Scenario: Whitespace-only query does not trigger search
   */
  it("does not enable the query when query is whitespace only", () => {
    const { result } = renderHook(() => useTrackSearch());

    act(() => {
      result.current.setQuery("   ");
    });

    expect(mockUseQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );
  });

  /**
   * Scenario: Typing triggers a debounced search
   *   Given I type "Bohemian" in the search field
   *   And I stop typing for 300ms
   *   Then a Spotify search is performed for "Bohemian"
   */
  it("enables the query when query is non-empty", () => {
    const { result } = renderHook(() => useTrackSearch());

    act(() => {
      result.current.setQuery("Bohemian");
    });

    expect(mockUseQuery).toHaveBeenLastCalledWith(
      { query: "Bohemian" },
      expect.objectContaining({ enabled: true }),
    );
  });

  /**
   * Scenario: Loading state is shown during search
   *   Given I have typed a search query
   *   When the Spotify search is in-flight
   *   Then isLoading is true
   */
  it("returns isLoading=true when query is non-empty and search is in-flight", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useTrackSearch());

    act(() => {
      result.current.setQuery("Bohemian");
    });

    expect(result.current.isLoading).toBe(true);
  });

  /**
   * Scenario: isLoading is false when query is empty even if hook returns loading
   */
  it("returns isLoading=false when query is empty regardless of API state", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useTrackSearch());

    // query is empty by default
    expect(result.current.isLoading).toBe(false);
  });

  /**
   * Scenario: Results populate after search completes
   *   Given I typed "Bohemian" and the search completed
   *   Then a list of track results is returned
   */
  it("returns results when search data is available", () => {
    const tracks = [
      { id: "t1", name: "Bohemian Rhapsody", artists: ["Queen"], albumArt: "https://img/t1.jpg" },
    ];
    mockUseQuery.mockReturnValue({ data: { tracks }, isLoading: false });

    const { result } = renderHook(() => useTrackSearch());

    act(() => {
      result.current.setQuery("Bohemian");
    });

    expect(result.current.results).toEqual(tracks);
  });

  /**
   * Exposes query and setQuery
   */
  it("exposes query and setQuery", () => {
    const { result } = renderHook(() => useTrackSearch());

    expect(result.current.query).toBe("");
    act(() => {
      result.current.setQuery("test");
    });
    expect(result.current.query).toBe("test");
  });
});
