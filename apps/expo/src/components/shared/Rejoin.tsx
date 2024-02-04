import { useMemo, type FC } from "react";
import { View } from "react-native";
import { useTracks } from "@fissa/utils";

import { api } from "../../utils";
import { Button } from "./button";

export const Rejoin = () => {
  const { data } = api.auth.getUserFissa.useQuery();

  const lastFissa = useMemo(() => data?.isIn[0]?.pin, [data?.isIn]);

  if (!lastFissa) return <View className="my-1 h-16" />; // We return view for the layout

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
  const { data } = api.track.byPin.useQuery(pin, {
    retry: false,
  });

  // Pre-fetch tracks
  useTracks(data?.map((track) => track.trackId));

  return null;
};
