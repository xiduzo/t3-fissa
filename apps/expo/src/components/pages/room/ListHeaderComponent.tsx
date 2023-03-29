import { FC } from "react";
import { View } from "react-native";
import { useSearchParams } from "expo-router";

import { useGetRoom } from "../../../hooks/";
import { ProgressBar, TrackListItem, Typography } from "../../shared";

export const ListHeaderComponent: FC<Props> = ({ tracks }) => {
  const { pin } = useSearchParams();

  const { data: room } = useGetRoom(pin!);

  if (!room) return null;
  const track = tracks[room.currentIndex];

  return (
    <>
      {track && (
        <TrackListItem
          track={track}
          bigImage
          extra={
            <ProgressBar
              track={track}
              expectedEndTime={room.expectedEndTime}
              disabled={room.currentIndex < 0}
            />
          }
        />
      )}
      <View className="mb-2 mt-7 flex-row items-center justify-between">
        <Typography variant="h2">Queue</Typography>
        <Typography variant="bodyM" dimmed>
          {tracks.length - 2}
        </Typography>
      </View>
    </>
  );
};

interface Props {
  tracks: SpotifyApi.TrackObjectFull[];
}
