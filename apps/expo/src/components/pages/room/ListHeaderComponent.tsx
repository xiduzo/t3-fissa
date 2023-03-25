import { FC } from "react";
import { View } from "react-native";
import { useSearchParams } from "expo-router";

import { useGetRoom } from "../../../hooks/";
import { ProgressBar, TrackListItem, Typography } from "../../shared";
import { PinCode } from "./PinCode";

export const ListHeaderComponent: FC<Props> = ({ tracks }) => {
  const { pin } = useSearchParams();

  const { data: room } = useGetRoom(pin!);

  if (!room) return null;
  if (!tracks.length) return <NowPlaying />;
  const track = tracks[room.currentIndex]!;

  return (
    <View className="px-6">
      <NowPlaying />
      <TrackListItem
        track={track}
        bigImage
        extra={
          <ProgressBar
            track={track}
            expectedEndTime={room.expectedEndTime}
            enabled={room.currentIndex >= 0}
          />
        }
      />
    </View>
  );
};

interface Props {
  tracks: SpotifyApi.TrackObjectFull[];
}

const NowPlaying = () => {
  return (
    <View className="flex-row items-center justify-between">
      <Typography variant="h2">Now Playing</Typography>
      <PinCode />
    </View>
  );
};
