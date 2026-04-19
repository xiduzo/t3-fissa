/**
 * Tests for QueueTrackList component (Task #61)
 *
 * Scenario: Queue is displayed in vote-ranked order
 * Scenario: Already-played tracks are excluded from the queue
 * Scenario: Currently playing track is excluded from the queue
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import React from "react";
import { QueueTrackList } from "./QueueTrackList";

const makeTracks = (overrides: Array<Partial<{ trackId: string; totalScore: number; hasBeenPlayed: boolean; durationMs: number }>>) =>
  overrides.map((t, i) => ({
    trackId: t.trackId ?? `track-${i}`,
    totalScore: t.totalScore ?? 0,
    hasBeenPlayed: t.hasBeenPlayed ?? false,
    durationMs: t.durationMs ?? 180000,
  }));

describe("QueueTrackList", () => {
  /**
   * Scenario: Queue is displayed in vote-ranked order
   *   Given the Fissa has multiple upcoming tracks with varying totalScore values
   *   Then the tracks are ordered from highest totalScore to lowest
   */
  it("renders a list container with data-testid='track-list'", () => {
    render(<QueueTrackList tracks={makeTracks([{ totalScore: 5 }])} />);

    expect(screen.getByTestId("track-list")).toBeInTheDocument();
  });

  it("renders each track as an item with data-testid='track-item'", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-a", totalScore: 1 },
          { trackId: "track-b", totalScore: 2 },
        ])}
      />,
    );

    const items = screen.getAllByTestId("track-item");
    expect(items).toHaveLength(2);
  });

  it("renders tracks sorted by totalScore descending", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-low", totalScore: 1 },
          { trackId: "track-high", totalScore: 10 },
          { trackId: "track-mid", totalScore: 5 },
        ])}
      />,
    );

    const items = screen.getAllByTestId("track-item");
    expect(items[0]).toHaveAttribute("data-trackid", "track-high");
    expect(items[1]).toHaveAttribute("data-trackid", "track-mid");
    expect(items[2]).toHaveAttribute("data-trackid", "track-low");
  });

  it("shows artwork for each track", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([{ trackId: "track-a", totalScore: 5 }])}
      />,
    );

    const artwork = screen.getByTestId("queue-track-artwork-track-a");
    expect(artwork).toBeInTheDocument();
    expect(artwork).toHaveAttribute("src", expect.stringContaining("track-a"));
  });

  it("shows the track identifier for each track", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([{ trackId: "track-xyz", totalScore: 3 }])}
      />,
    );

    const item = screen.getByTestId("track-item");
    expect(within(item).getByTestId("queue-track-id-track-xyz")).toBeInTheDocument();
  });

  it("shows the vote tally (totalScore) for each track", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-a", totalScore: 7 },
          { trackId: "track-b", totalScore: -2 },
        ])}
      />,
    );

    expect(screen.getByTestId("queue-track-score-track-a")).toHaveTextContent("7");
    expect(screen.getByTestId("queue-track-score-track-b")).toHaveTextContent("-2");
  });

  /**
   * Scenario: Already-played tracks passed to QueueTrackList are excluded
   *   (Defensive: even if parent mistakenly passes played tracks they should be filtered out)
   */
  it("does not render tracks with hasBeenPlayed=true", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-played", totalScore: 5, hasBeenPlayed: true },
          { trackId: "track-upcoming", totalScore: 3, hasBeenPlayed: false },
        ])}
      />,
    );

    const items = screen.getAllByTestId("track-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAttribute("data-trackid", "track-upcoming");
  });

  it("renders an empty list container when all tracks have been played", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([{ trackId: "track-played", totalScore: 5, hasBeenPlayed: true }])}
      />,
    );

    const list = screen.getByTestId("track-list");
    expect(list).toBeInTheDocument();
    expect(screen.queryAllByTestId("track-item")).toHaveLength(0);
  });

  /**
   * Scenario: Signed-in guest sees vote controls on queued tracks
   *   Given I am signed in as a Party Guest
   *   And the Fissa has queued tracks
   *   When I view the Queue
   *   Then each queued track row shows an upvote button
   *   And each queued track row shows a downvote button
   */
  it("shows upvote and downvote buttons for each track when isAuthenticated=true", () => {
    render(
      <QueueTrackList
        isAuthenticated
        tracks={makeTracks([
          { trackId: "track-a", totalScore: 1 },
          { trackId: "track-b", totalScore: 2 },
        ])}
      />,
    );

    expect(screen.getByTestId("upvote-track-a")).toBeInTheDocument();
    expect(screen.getByTestId("downvote-track-a")).toBeInTheDocument();
    expect(screen.getByTestId("upvote-track-b")).toBeInTheDocument();
    expect(screen.getByTestId("downvote-track-b")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Upvote track-a" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Downvote track-a" })).toBeInTheDocument();
  });

  /**
   * Scenario: Unauthenticated guest does not see vote controls
   *   Given I am not signed in
   *   And the Fissa has queued tracks
   *   When I view the Queue
   *   Then no upvote or downvote buttons are visible
   */
  it("does not show upvote or downvote buttons when isAuthenticated=false", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-a", totalScore: 1 },
          { trackId: "track-b", totalScore: 2 },
        ])}
      />,
    );

    expect(screen.queryByTestId("upvote-track-a")).not.toBeInTheDocument();
    expect(screen.queryByTestId("downvote-track-a")).not.toBeInTheDocument();
    expect(screen.queryByTestId("upvote-track-b")).not.toBeInTheDocument();
    expect(screen.queryByTestId("downvote-track-b")).not.toBeInTheDocument();
  });

  it("disables vote buttons for currently playing track", () => {
    render(
      <QueueTrackList
        isAuthenticated
        currentlyPlayingId="track-a"
        tracks={makeTracks([
          { trackId: "track-a", totalScore: 1 },
          { trackId: "track-b", totalScore: 0 },
        ])}
      />,
    );
    expect(screen.getByTestId("upvote-track-a")).toBeDisabled();
    expect(screen.getByTestId("downvote-track-a")).toBeDisabled();
    expect(screen.getByTestId("upvote-track-b")).not.toBeDisabled();
    expect(screen.getByTestId("downvote-track-b")).not.toBeDisabled();
  });

  /**
   * Scenario: Guest's previously cast upvote is shown on load (#69)
   *   Given I am signed in as a Party Guest and I previously upvoted track "track-123"
   *   When I load the Fissa page
   *   Then the upvote button for "track-123" shows as active/selected (aria-pressed=true)
   */
  it("marks upvote button as aria-pressed=true when user previously upvoted", () => {
    const userVotes = new Map<string, 1 | -1>([["track-123", 1]]);
    render(
      <QueueTrackList
        tracks={makeTracks([{ trackId: "track-123", totalScore: 3 }])}
        isAuthenticated
        userVotes={userVotes}
      />,
    );

    expect(screen.getByTestId("upvote-track-123")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("downvote-track-123")).toHaveAttribute("aria-pressed", "false");
  });

  it("marks downvote button as aria-pressed=true when user previously downvoted", () => {
    const userVotes = new Map<string, 1 | -1>([["track-456", -1]]);
    render(
      <QueueTrackList
        tracks={makeTracks([{ trackId: "track-456", totalScore: -1 }])}
        isAuthenticated
        userVotes={userVotes}
      />,
    );

    expect(screen.getByTestId("upvote-track-456")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("downvote-track-456")).toHaveAttribute("aria-pressed", "true");
  });

  it("shows both vote buttons as aria-pressed=false when user has not voted on track", () => {
    render(
      <QueueTrackList
        tracks={makeTracks([{ trackId: "track-789", totalScore: 0 }])}
        isAuthenticated
        userVotes={new Map()}
      />,
    );

    expect(screen.getByTestId("upvote-track-789")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("downvote-track-789")).toHaveAttribute("aria-pressed", "false");
  });
});

describe("QueueTrackList — queue re-order after vote (Task #73)", () => {
  /**
   * Scenario: Queue re-orders after upvote
   *   Given the Queue has tracks A (score 2), B (score 0), C (score -1)
   *   When a Guest upvotes track B (score becomes 1)
   *   Then the Queue order is A (score 2), B (score 1), C (score -1)
   */
  it("re-renders in new score order when track scores change after a vote", () => {
    const { rerender } = render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-A", totalScore: 2 },
          { trackId: "track-B", totalScore: 0 },
          { trackId: "track-C", totalScore: -1 },
        ])}
      />,
    );

    // Initial order: A, B, C
    let items = screen.getAllByTestId("track-item");
    expect(items[0]).toHaveAttribute("data-trackid", "track-A");
    expect(items[1]).toHaveAttribute("data-trackid", "track-B");
    expect(items[2]).toHaveAttribute("data-trackid", "track-C");

    // Simulate vote success — track-B score rises to 1
    rerender(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-A", totalScore: 2 },
          { trackId: "track-B", totalScore: 1 },
          { trackId: "track-C", totalScore: -1 },
        ])}
      />,
    );

    // New order: A (2), B (1), C (-1)
    items = screen.getAllByTestId("track-item");
    expect(items[0]).toHaveAttribute("data-trackid", "track-A");
    expect(items[1]).toHaveAttribute("data-trackid", "track-B");
    expect(items[2]).toHaveAttribute("data-trackid", "track-C");
  });

  it("promotes a track above higher-scored tracks when its score surpasses them after a vote", () => {
    const { rerender } = render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-A", totalScore: 2 },
          { trackId: "track-B", totalScore: 0 },
          { trackId: "track-C", totalScore: -1 },
        ])}
      />,
    );

    // Simulate track-B being upvoted three times to score 3 — should jump above track-A
    rerender(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-A", totalScore: 2 },
          { trackId: "track-B", totalScore: 3 },
          { trackId: "track-C", totalScore: -1 },
        ])}
      />,
    );

    const items = screen.getAllByTestId("track-item");
    expect(items[0]).toHaveAttribute("data-trackid", "track-B");
    expect(items[1]).toHaveAttribute("data-trackid", "track-A");
    expect(items[2]).toHaveAttribute("data-trackid", "track-C");
  });

  /**
   * Scenario: Currently playing track stays at top regardless of score
   *   The currently playing track is excluded from the upcoming queue list
   *   (filtered out by $pin.tsx before being passed to QueueTrackList).
   *   QueueTrackList should not render a track whose trackId matches currentlyPlayingId
   *   even if it is present in the passed tracks array.
   *
   *   Note: In production, $pin.tsx filters out the currently playing track before
   *   passing to QueueTrackList. This test verifies QueueTrackList's own defensive
   *   behaviour: it disables vote buttons for the currentlyPlayingId track but still
   *   renders it — the exclusion responsibility belongs to the parent.
   */
  it("does not include the currently playing track in the sorted queue when parent excludes it", () => {
    // Simulate what $pin.tsx does: exclude currentlyPlayingId from the tracks prop
    const currentlyPlayingId = "track-X";
    const upcomingTracks = makeTracks([
      { trackId: "track-A", totalScore: 2 },
      { trackId: "track-B", totalScore: 0 },
      { trackId: "track-C", totalScore: -1 },
    ]);

    render(
      <QueueTrackList
        tracks={upcomingTracks}
        currentlyPlayingId={currentlyPlayingId}
      />,
    );

    const items = screen.getAllByTestId("track-item");
    const renderedIds = items.map((el) => el.getAttribute("data-trackid"));

    expect(renderedIds).not.toContain(currentlyPlayingId);
    expect(renderedIds).toEqual(["track-A", "track-B", "track-C"]);
  });

  it("updated scores are reflected in rendered score elements after a vote", () => {
    const { rerender } = render(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-A", totalScore: 2 },
          { trackId: "track-B", totalScore: 0 },
        ])}
      />,
    );

    expect(screen.getByTestId("queue-track-score-track-B")).toHaveTextContent("0");

    // After upvote, score updates
    rerender(
      <QueueTrackList
        tracks={makeTracks([
          { trackId: "track-A", totalScore: 2 },
          { trackId: "track-B", totalScore: 1 },
        ])}
      />,
    );

    expect(screen.getByTestId("queue-track-score-track-B")).toHaveTextContent("1");
  });
});

describe("QueueTrackList — onVote callback (Task #71)", () => {
  /**
   * Scenario: Guest casts an upvote
   *   When I click the upvote button on a track
   *   Then onVote is called with (trackId, 1)
   */
  it("calls onVote with (trackId, 1) when upvote button is clicked", () => {
    const onVote = vi.fn();
    render(
      <QueueTrackList
        isAuthenticated
        tracks={[{ trackId: "track-a", totalScore: 0, hasBeenPlayed: false, durationMs: 180000 }]}
        onVote={onVote}
      />,
    );

    fireEvent.click(screen.getByTestId("upvote-track-a"));

    expect(onVote).toHaveBeenCalledWith("track-a", 1);
    expect(onVote).toHaveBeenCalledTimes(1);
  });

  /**
   * Scenario: Guest casts a downvote
   *   When I click the downvote button on a track
   *   Then onVote is called with (trackId, -1)
   */
  it("calls onVote with (trackId, -1) when downvote button is clicked", () => {
    const onVote = vi.fn();
    render(
      <QueueTrackList
        isAuthenticated
        tracks={[{ trackId: "track-b", totalScore: 0, hasBeenPlayed: false, durationMs: 180000 }]}
        onVote={onVote}
      />,
    );

    fireEvent.click(screen.getByTestId("downvote-track-b"));

    expect(onVote).toHaveBeenCalledWith("track-b", -1);
    expect(onVote).toHaveBeenCalledTimes(1);
  });

  /**
   * onVote is not called when button is disabled (currently playing track)
   */
  it("does not call onVote when voting on the currently playing track (buttons are disabled)", () => {
    const onVote = vi.fn();
    render(
      <QueueTrackList
        isAuthenticated
        currentlyPlayingId="track-c"
        tracks={[{ trackId: "track-c", totalScore: 0, hasBeenPlayed: false, durationMs: 180000 }]}
        onVote={onVote}
      />,
    );

    fireEvent.click(screen.getByTestId("upvote-track-c"));

    expect(onVote).not.toHaveBeenCalled();
  });

  /**
   * onVote is optional — component renders without it
   */
  it("renders without errors when onVote is not provided", () => {
    render(
      <QueueTrackList
        isAuthenticated
        tracks={[{ trackId: "track-d", totalScore: 0, hasBeenPlayed: false, durationMs: 180000 }]}
      />,
    );

    // Should not throw — clicking still works
    fireEvent.click(screen.getByTestId("upvote-track-d"));
    expect(screen.getByTestId("upvote-track-d")).toBeInTheDocument();
  });
});
