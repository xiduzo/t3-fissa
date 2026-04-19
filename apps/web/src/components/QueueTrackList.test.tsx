/**
 * Tests for QueueTrackList component (Task #61)
 *
 * Scenario: Queue is displayed in vote-ranked order
 * Scenario: Already-played tracks are excluded from the queue
 * Scenario: Currently playing track is excluded from the queue
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
});
