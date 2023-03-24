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
    <>
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
      <View className="mb-5 mt-8 flex-row items-center justify-between">
        <Typography variant="h2">Queue</Typography>
        <Typography variant="bodyM" dimmed>
          {tracks.length}
        </Typography>
      </View>
    </>
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
