import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getPlaylists, getPlaylistTracks, splitInChunks, useSpotify } from "@fissa/utils";

/**
 * TanStack Query hooks for Spotify API calls.
 * These use the same QueryClient + SQLite persister as tRPC queries,
 * so all data is cached to disk and follows stale-while-revalidate.
 */

/** Fetch the current user's playlists from Spotify. */
export const useSpotifyPlaylists = (user?: SpotifyApi.CurrentUsersProfileResponse) => {
  const spotify = useSpotify();

  return useQuery({
    queryKey: ["spotify", "playlists", user?.id],
    queryFn: () => getPlaylists(user!, spotify),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min — playlists rarely change
  });
};

/** Fetch tracks for a specific playlist from Spotify. */
export const usePlaylistTracks = (playlistId: string | null) => {
  const spotify = useSpotify();

  return useQuery({
    queryKey: ["spotify", "playlistTracks", playlistId],
    queryFn: () => getPlaylistTracks(playlistId!, spotify),
    enabled: !!playlistId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch full track objects from Spotify by ID.
 * Batches into chunks of 50 (Spotify API limit).
 *
 * The Spotify fetch is keyed by the *set* of IDs (sorted) so we don't
 * refetch just because the playlist order changed.  A separate useMemo
 * re-maps the cached tracks into the caller-supplied order so vote-based
 * reordering is reflected immediately.
 */
export const useSpotifyTracks = (trackIds?: string[]) => {
  const spotify = useSpotify();

  // Stable query key — sorted so order doesn't matter for fetching
  const sortedKey = trackIds?.length ? [...trackIds].sort().join(",") : "";

  const query = useQuery({
    queryKey: ["spotify", "tracks", sortedKey],
    queryFn: async () => {
      if (!trackIds?.length) return [];
      const chunks = splitInChunks(trackIds);
      const responses = await Promise.all(chunks.map((chunk) => spotify.getTracks(chunk)));
      return responses.flatMap(({ tracks }) => tracks);
    },
    enabled: !!trackIds?.length,
    staleTime: 10 * 60 * 1000, // 10 min — track metadata is very stable
  });

  // Re-order cached tracks whenever trackIds order changes (e.g. after votes)
  const ordered = useMemo(() => {
    if (!query.data?.length || !trackIds?.length) return [];
    const map = new Map(query.data.map((t) => [t.id, t]));
    return trackIds
      .map((id) => map.get(id))
      .filter((t): t is SpotifyApi.TrackObjectFull => !!t);
  }, [query.data, trackIds]);

  return { ...query, data: ordered };
};

/** Fetch the user's connected Spotify devices. */
export const useSpotifyDevices = (enabled = true) => {
  const spotify = useSpotify();

  const query = useQuery({
    queryKey: ["spotify", "devices"],
    queryFn: async () => {
      const { devices } = await spotify.getMyDevices();
      return devices;
    },
    enabled,
    staleTime: 0, // devices change frequently — always refetch
    gcTime: 60_000,
  });

  const devices = query.data ?? [];
  const activeDevice = devices.find(({ is_active }) => is_active);

  return { ...query, devices, activeDevice };
};
