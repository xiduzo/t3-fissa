import { useSearchParams } from "expo-router";
import { useTracks } from "@fissa/utils";

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

  const tracks = useTracks(
    spotify,
    data?.map((track) => track.trackId),
  );

  if (!data) return null;

  return (
    <TrackList
      tracks={tracks}
      ListHeaderComponent={
        <Typography variant="h2">Tracks header {tracks.length}</Typography>
      }
      onTrackPress={(track) => {
        console.log(track.name);
      }}
      ListEmptyComponent={<Typography variant="h3">No tracks found</Typography>}
      ListFooterComponent={RoomListFooterComponent}
    />
  );
};
