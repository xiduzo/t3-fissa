import { useMemo, useState } from "react";
import { useSearchParams } from "expo-router";

import { useSpotify } from "../../../providers";
import { api } from "../../../utils/api";
import { TrackList, Typography } from "../../shared";
import { RoomListFooterComponent } from "./ListFooterComponent";

export const RoomTracks = () => {
  const { pin } = useSearchParams();
  const spotify = useSpotify();

  const { data } = api.track.byRoomId.useQuery(pin!, {
    enabled: !!pin,
    refetchInterval: 5000,
  });

  const [tracks, setTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);

  useMemo(async () => {
    if (!data) return null;

    const trackIds = data.map((track) => track.trackId);
    const { tracks } = await spotify.getTracks(trackIds);

    setTracks(tracks);
  }, [data, spotify]);

  if (!data) return null;

  return (
    <TrackList
      tracks={tracks}
      ListHeaderComponent={<Typography variant="h2">Tracks header</Typography>}
      ListEmptyComponent={<Typography variant="h3">No tracks found</Typography>}
      ListFooterComponent={RoomListFooterComponent}
    />
  );
};
