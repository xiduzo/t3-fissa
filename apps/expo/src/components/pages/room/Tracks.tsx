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

  const tracks = useTracks(data?.map((track) => track.trackId));

  if (!data) return null;

  const isPlaying = (room?.currentIndex ?? -1) >= 0;

  return (
    <>
      <ListHeaderComponent tracks={tracks} />
      <TrackList
        tracks={isPlaying ? tracks : []}
        onTrackPress={(track) => {
          console.info(track.name);
        }}
        ListHeaderComponent={
          <View className="mb-2 mt-7 flex-row items-center justify-between">
            <Typography variant="h2">Queue</Typography>
            <Typography variant="bodyM" dimmed>
              {tracks.length}
            </Typography>
          </View>
        }
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
    </>
  );
};
