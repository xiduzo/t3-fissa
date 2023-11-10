import { useMemo, type FC } from "react";
import { View } from "react-native";
import { useGetTracks, useGetUserFissa } from "@fissa/hooks";
import { useTracks } from "@fissa/utils";

import { Button } from "./button";

export const Rejoin = () => {
  const { data } = useGetUserFissa();

  const lastFissa = useMemo(() => data?.isIn[0]?.pin, [data?.isIn]);

  if (!lastFissa) return <View />; // We return view for the layout

  return (
    <View>
      <PrefetchTracks pin={lastFissa} />
      <Button
        variant="text"
        title={`Re-join last fissa (${lastFissa})`}
        linkTo={`/fissa/${lastFissa}`}
      />
    </View>
  );
};

const PrefetchTracks: FC<{ pin: string }> = ({ pin }) => {
  const { data } = useGetTracks(pin);

  // Pre-fetch tracks
  useTracks(data?.map((track) => track.trackId));

  return null;
};
