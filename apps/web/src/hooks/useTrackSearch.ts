import { api } from "~/utils/api";
import { useDebounce } from "./useDebounce";
import { useState } from "react";
import type { SearchTrack } from "~/components/AddTrackSheet";

/**
 * Custom hook wrapping the Spotify search tRPC query with debounce logic.
 * Never fires for empty / whitespace-only queries.
 *
 * Exposes { results, isLoading, query, setQuery }
 */
export function useTrackSearch(debounceMs = 300) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), debounceMs);

  const { data, isLoading } = api.spotify.searchTracks.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  const results: SearchTrack[] = data?.tracks ?? [];

  return { results, isLoading: debouncedQuery.length > 0 && isLoading, query, setQuery };
}
