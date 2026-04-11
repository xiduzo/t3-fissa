import SpotifyWebApi from "spotify-web-api-js";
import { create } from "zustand";

/**
 * Minimal Zustand store — only holds the SpotifyWebApi client instance.
 * All data fetching is handled by TanStack Query hooks in the expo app.
 */

const useSpotifyStore = create(() => ({
  spotify: new SpotifyWebApi(),
}));

export const useSpotify = () => {
  return useSpotifyStore((s) => s.spotify);
};
