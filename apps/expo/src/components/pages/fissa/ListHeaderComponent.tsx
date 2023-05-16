import { FC, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useSearchParams } from "expo-router";
import { useGetFissaDetails, useSkipTrack } from "@fissa/hooks";

import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Action, Divider, Popover, ProgressBar, TrackListItem, Typography } from "../../shared";

export const ListHeaderComponent: FC<Props> = ({ queue, activeTrack }) => {
  const { pin } = useSearchParams();
  const [trackSelected, setTrackSelected] = useState(false);

  const { data } = useGetFissaDetails(String(pin));

  const toggleTrackSelected = useCallback(() => {
    setTrackSelected((prev) => !prev);
  }, []);

  if (!data) return null;

  return (
    <View className="px-6">
      {activeTrack && (
        <TrackListItem
          key={data?.expectedEndTime.toString()}
          track={activeTrack}
          bigImage
          onPress={toggleTrackSelected}
          extra={
            <ProgressBar
              className="mt-4"
              track={activeTrack}
              expectedEndTime={data.expectedEndTime}
              disabled={!data.currentlyPlayingId}
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
      <Popover visible={!!trackSelected} onRequestClose={toggleTrackSelected}>
        <TrackListItem
          key={data?.expectedEndTime.toString()}
          track={activeTrack!}
          inverted
          extra={
            <ProgressBar
              inverted
              track={activeTrack!}
              expectedEndTime={data.expectedEndTime}
              disabled={!data.currentlyPlayingId}
            />
          }
        />
        <Divider />
        <SkipTrackAction pin={String(pin)} owner={data.by.email!} onPress={toggleTrackSelected} />
      </Popover>
    </View>
  );
};

interface Props {
  queue: number;
  activeTrack?: SpotifyApi.TrackObjectFull;
}

const SkipTrackAction: FC<{
  pin: string;
  owner: string;
  onPress: () => void;
}> = ({ pin, owner, onPress }) => {
  const { user } = useAuth();
  const { mutateAsync, isLoading } = useSkipTrack(pin, {
    onMutate: () => {
      onPress();
      toast.info({
        icon: "🐍",
        message: "Ssssssssskipping song",
      });
    },
    onSettled: () => {
      toast.hide();
    },
  });

  const isOwner = useMemo(() => owner === user?.email, [owner, user]);

  return (
    <Action
      title="Skip song"
      subtitle={isOwner ? "Skip the current song" : "Poke your host to skip"}
      inverted
      disabled={!isOwner || isLoading}
      onPress={mutateAsync}
      icon="magic"
    />
  );
};
