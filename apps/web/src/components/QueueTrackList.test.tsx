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
   * Scenario: Vote error indicator and retry button
   */
  describe("vote error indicator and retry (Task #78)", () => {
    it("shows vote error indicator when voteErrors has the trackId", () => {
      const voteErrors = new Map([["track-a", { vote: 1 as const }]]);
      render(
        <QueueTrackList
          tracks={makeTracks([{ trackId: "track-a", totalScore: 3 }])}
          voteErrors={voteErrors}
        />,
      );

      expect(screen.getByTestId("vote-error-track-a")).toBeInTheDocument();
    });

    it("shows retry button when voteErrors has the trackId", () => {
      const voteErrors = new Map([["track-a", { vote: 1 as const }]]);
      render(
        <QueueTrackList
          tracks={makeTracks([{ trackId: "track-a", totalScore: 3 }])}
          voteErrors={voteErrors}
        />,
      );

      expect(screen.getByTestId("retry-vote-track-a")).toBeInTheDocument();
    });

    it("does not show error indicator or retry button when voteErrors is empty", () => {
      render(
        <QueueTrackList
          tracks={makeTracks([{ trackId: "track-a", totalScore: 3 }])}
          voteErrors={new Map()}
        />,
      );

      expect(screen.queryByTestId("vote-error-track-a")).not.toBeInTheDocument();
      expect(screen.queryByTestId("retry-vote-track-a")).not.toBeInTheDocument();
    });

    it("does not show error indicator when voteErrors prop is not provided", () => {
      render(
        <QueueTrackList tracks={makeTracks([{ trackId: "track-a", totalScore: 3 }])} />,
      );

      expect(screen.queryByTestId("vote-error-track-a")).not.toBeInTheDocument();
    });

    it("calls onRetryVote with trackId and vote when retry button is clicked", () => {
      const voteErrors = new Map([["track-a", { vote: 1 as const }]]);
      const onRetryVote = vi.fn();
      render(
        <QueueTrackList
          tracks={makeTracks([{ trackId: "track-a", totalScore: 3 }])}
          voteErrors={voteErrors}
          onRetryVote={onRetryVote}
        />,
      );

      fireEvent.click(screen.getByTestId("retry-vote-track-a"));

      expect(onRetryVote).toHaveBeenCalledWith("track-a", 1);
    });

    it("only shows error for tracks with errors, not for tracks without errors", () => {
      const voteErrors = new Map([["track-a", { vote: -1 as const }]]);
      render(
        <QueueTrackList
          tracks={makeTracks([
            { trackId: "track-a", totalScore: 3 },
            { trackId: "track-b", totalScore: 1 },
          ])}
          voteErrors={voteErrors}
        />,
      );

      expect(screen.getByTestId("vote-error-track-a")).toBeInTheDocument();
      expect(screen.queryByTestId("vote-error-track-b")).not.toBeInTheDocument();
      expect(screen.queryByTestId("retry-vote-track-b")).not.toBeInTheDocument();
    });
  });

  /**
   * Task #76: Disable vote controls for currently playing track
   *
   * Scenario: Vote controls are disabled on currently playing track
   *   Given I am signed in as a Party Guest
   *   And track "Hotel California" is currently playing
   *   When I view the Queue
   *   Then the upvote and downvote buttons on "Hotel California" are disabled
   *   And I cannot click them
   *
   * Scenario: Vote controls are enabled on all other queued tracks
   *   Given I am signed in as a Party Guest
   *   And track "Hotel California" is currently playing
   *   And "Roxanne" is queued but not playing
   *   When I view the Queue
   *   Then the upvote and downvote buttons on "Roxanne" are enabled
   */
  describe("disable vote controls for currently playing track (Task #76)", () => {
    it("disables upvote button for the currently playing track", () => {
      render(
        <QueueTrackList
          tracks={makeTracks([
            { trackId: "hotel-california", totalScore: 5 },
            { trackId: "roxanne", totalScore: 3 },
          ])}
          isAuthenticated
          currentlyPlayingId="hotel-california"
          onVote={vi.fn()}
        />,
      );

      expect(screen.getByTestId("upvote-hotel-california")).toBeDisabled();
    });

    it("disables downvote button for the currently playing track", () => {
      render(
        <QueueTrackList
          tracks={makeTracks([
            { trackId: "hotel-california", totalScore: 5 },
            { trackId: "roxanne", totalScore: 3 },
          ])}
          isAuthenticated
          currentlyPlayingId="hotel-california"
          onVote={vi.fn()}
        />,
      );

      expect(screen.getByTestId("downvote-hotel-california")).toBeDisabled();
    });

    it("does not disable upvote button for tracks that are not currently playing", () => {
      render(
        <QueueTrackList
          tracks={makeTracks([
            { trackId: "hotel-california", totalScore: 5 },
            { trackId: "roxanne", totalScore: 3 },
          ])}
          isAuthenticated
          currentlyPlayingId="hotel-california"
          onVote={vi.fn()}
        />,
      );

      expect(screen.getByTestId("upvote-roxanne")).not.toBeDisabled();
    });

    it("does not disable downvote button for tracks that are not currently playing", () => {
      render(
        <QueueTrackList
          tracks={makeTracks([
            { trackId: "hotel-california", totalScore: 5 },
            { trackId: "roxanne", totalScore: 3 },
          ])}
          isAuthenticated
          currentlyPlayingId="hotel-california"
          onVote={vi.fn()}
        />,
      );

      expect(screen.getByTestId("downvote-roxanne")).not.toBeDisabled();
    });

    it("does not disable vote buttons when currentlyPlayingId is undefined (nothing playing)", () => {
      render(
        <QueueTrackList
          tracks={makeTracks([{ trackId: "roxanne", totalScore: 3 }])}
          isAuthenticated
          currentlyPlayingId={undefined}
          onVote={vi.fn()}
        />,
      );

      expect(screen.getByTestId("upvote-roxanne")).not.toBeDisabled();
      expect(screen.getByTestId("downvote-roxanne")).not.toBeDisabled();
    });

    it("disabled vote buttons cannot be clicked (onClick not invoked)", () => {
      const onVote = vi.fn();
      render(
        <QueueTrackList
          tracks={makeTracks([{ trackId: "hotel-california", totalScore: 5 }])}
          isAuthenticated
          currentlyPlayingId="hotel-california"
          onVote={onVote}
        />,
      );

      fireEvent.click(screen.getByTestId("upvote-hotel-california"));
      fireEvent.click(screen.getByTestId("downvote-hotel-california"));

      expect(onVote).not.toHaveBeenCalled();
    });

    it("disabled state applies regardless of prior votes (aria-pressed true but still disabled)", () => {
      const userVotes = new Map<string, 1 | -1>([["hotel-california", 1]]);
      render(
        <QueueTrackList
          tracks={makeTracks([{ trackId: "hotel-california", totalScore: 5 }])}
          isAuthenticated
          currentlyPlayingId="hotel-california"
          userVotes={userVotes}
          onVote={vi.fn()}
        />,
      );

      const upvote = screen.getByTestId("upvote-hotel-california");
      expect(upvote).toBeDisabled();
      expect(upvote).toHaveAttribute("aria-pressed", "true");
    });
  });
});
