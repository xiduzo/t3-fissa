import { View } from "react-native";
import { useSearchParams } from "expo-router";
import { useTracks } from "@fissa/utils";

import { useGetRoom, useGetTracks } from "../../../hooks";
import { TrackList, Typography } from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { ListHeaderComponent } from "./ListHeaderComponent";

export const RoomTracks = () => {
  const { pin } = useSearchParams();

  const { data, isInitialLoading } = useGetTracks(pin!);
  const { data: room } = useGetRoom(pin!);
  const tracks = useTracks(data?.map(({ trackId }) => trackId));

  if (!data) return null;

  const isPlaying = (room?.currentIndex ?? -1) >= 0;

  return (
    <>
      <TrackList
        tracks={isPlaying ? tracks : []}
        onTrackPress={(track) => {
          console.info(track.name);
        }}
        ListHeaderComponent={<ListHeaderComponent tracks={tracks} />}
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={isInitialLoading || tracks.length !== data.length}
          />
        }
        ListFooterComponent={
          Boolean(tracks.length) && isPlaying && !isInitialLoading ? (
            <ListFooterComponent />
          ) : null
        }
      />
    </>
  );
};
