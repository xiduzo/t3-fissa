import { FC, useEffect, useState } from "react";
import { View, ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";
import { cva, differenceInMilliseconds } from "@fissa/utils";

export const ProgressBar: FC<Props> = ({ expectedEndTime, track, enabled }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const updateFrequency = 1000;
    const interval = setInterval(() => {
      const difference = differenceInMilliseconds(expectedEndTime, new Date());

      const max = 100;
      const progress = (max - (difference * max) / track.duration_ms) / max;
      setProgress(Math.min(1, progress));
    }, updateFrequency);

    return () => {
      clearInterval(interval);
    };
  }, [track.duration_ms, expectedEndTime, enabled]);

  return (
    <View
      className={progressBar({ enabled: !!enabled || !progress })}
      style={{ backgroundColor: theme["100"] + "20" }}
    >
      <LinearGradient
        colors={theme.gradient}
        className="h-1.5 rounded-r-md"
        style={{ flex: progress }}
      />
    </View>
  );
};

const progressBar = cva("flex-row overflow-hidden rounded-md", {
  variants: {
    enabled: {
      false: "opacity-60",
    },
  },
});

interface Props extends ViewProps {
  expectedEndTime: Date;
  enabled?: boolean;
  track: SpotifyApi.TrackObjectFull;
}
