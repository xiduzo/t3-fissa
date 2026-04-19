/**
 * Tests for CurrentlyPlayingTrack component (Task #59)
 *
 * Scenario: Currently playing track is rendered on page load
 * Scenario: No currently playing track
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CurrentlyPlayingTrack } from "./CurrentlyPlayingTrack";

const mockTrack = {
  trackId: "4uLU6hMCjMI75M1A2tKUQC",
  durationMs: 210000,
  score: 3,
  totalScore: 10,
  hasBeenPlayed: false,
};

describe("CurrentlyPlayingTrack", () => {
  /**
   * Scenario: Currently playing track is rendered on page load
   *   Then the currently playing track's artwork is visible
   *   And a progress indicator is shown
   */
  it("renders track artwork when a track is provided", () => {
    render(<CurrentlyPlayingTrack track={mockTrack} />);

    const artwork = screen.getByTestId("track-artwork");
    expect(artwork).toBeInTheDocument();
    expect(artwork).toHaveAttribute("src", expect.stringContaining(mockTrack.trackId));
  });

  it("renders a progress indicator when a track is provided", () => {
    render(<CurrentlyPlayingTrack track={mockTrack} />);

    expect(screen.getByTestId("track-progress")).toBeInTheDocument();
  });

  it("renders a track-id element when a track is provided", () => {
    render(<CurrentlyPlayingTrack track={mockTrack} />);

    const idEl = screen.getByTestId("track-id");
    expect(idEl).toHaveTextContent(mockTrack.trackId);
  });

  /**
   * Scenario: No currently playing track
   *   Then the CurrentlyPlayingTrack slot is empty or shows a placeholder
   */
  it("renders nothing when track is undefined", () => {
    const { container } = render(<CurrentlyPlayingTrack track={undefined} />);

    expect(container.firstChild).toBeNull();
  });
});
