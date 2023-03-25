import { useSearchParams } from "expo-router";
import { useTracks } from "@fissa/utils";

import { useGetRoom } from "../../../hooks";
import { api } from "../../../utils/api";
import { TrackList } from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { ListHeaderComponent } from "./ListHeaderComponent";

export const RoomTracks = () => {
  const { pin } = useSearchParams();

  const { data, isInitialLoading } = api.track.byRoomId.useQuery(pin!);
  const { data: room } = useGetRoom(pin!);

  const tracks = useTracks(data?.map((track) => track.trackId));

  if (!data) return null;

  const isPlaying = (room?.currentIndex ?? -1) >= 0;

  return (
    <TrackList
      tracks={isPlaying ? tracks : []}
      ListHeaderComponent={<ListHeaderComponent tracks={tracks} />}
      onTrackPress={(track) => {
        console.info(track.name);
      }}
      ListEmptyComponent={
        <ListEmptyComponent
          isLoading={isInitialLoading || tracks.length !== data.length}
        />
      }
      ListFooterComponent={() => {
        if (!tracks.length) return null;
        if (!isPlaying) return null;
        if (isInitialLoading) return null;
        return <ListFooterComponent />;
      }}
    />
  );
};
