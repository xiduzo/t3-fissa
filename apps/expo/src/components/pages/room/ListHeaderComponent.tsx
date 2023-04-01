import { FC } from "react";
import { View } from "react-native";
import { useSearchParams } from "expo-router";

import { useGetRoomDetails } from "../../../hooks/";
import { ProgressBar, TrackListItem, Typography } from "../../shared";

export const ListHeaderComponent: FC<Props> = ({ queue, activeTrack }) => {
  const { pin } = useSearchParams();

  const { data } = useGetRoomDetails(pin!);

  if (!data) return null;

  return (
    <>
      {activeTrack && (
        <TrackListItem
          track={activeTrack}
          bigImage
          extra={
            <ProgressBar
              track={activeTrack}
              expectedEndTime={data.expectedEndTime}
              disabled={data.currentIndex < 0}
            />
          }
        />
      )}
      <View className="mb-2 mt-7 flex-row items-center justify-between">
        <Typography variant="h2">Queue</Typography>
        <Typography variant="bodyM" dimmed>
          {queue}
        </Typography>
      </View>
    </>
  );
};

interface Props {
  queue: number;
  activeTrack?: SpotifyApi.TrackObjectFull;
}
