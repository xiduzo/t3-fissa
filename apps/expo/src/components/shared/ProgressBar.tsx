import { useEffect, useState, type FC } from "react";
import { View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";
import { cva, differenceInMilliseconds, type VariantProps } from "@fissa/utils";

export const ProgressBar: FC<Props> = ({
  expectedEndTime,
  track,
  disabled,
  inverted,
  className,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!!disabled) return;

    const updateFrequency = 1000;

    const updateProgress = () => {
      const difference = differenceInMilliseconds(expectedEndTime, new Date());

      const max = 100;
      const progress = (max - (difference * max) / track.duration_ms) / max;
      setProgress(Math.min(1, progress));
    };

    const interval = setInterval(updateProgress, updateFrequency);

    updateProgress();

    return () => {
      clearInterval(interval);
    };
  }, [track.duration_ms, expectedEndTime, disabled]);

  return (
    <View
      className={progressBar({
        disabled: Boolean(disabled) || !progress,
        className,
      })}
      style={{ backgroundColor: theme[inverted ? "900" : "100"] + "20" }}
    >
      <LinearGradient
        start={[0, 0]}
        end={[1, 1]}
        colors={inverted ? [theme["900"]] : theme.gradient}
        className="h-1.5 rounded-r-md"
        style={{ flex: progress }}
      />
    </View>
  );
};

const progressBar = cva("flex-row overflow-hidden rounded-md w-full", {
  variants: {
    disabled: {
      true: "opacity-60",
    },
  },
});

interface Props extends ViewProps, VariantProps<typeof progressBar> {
  expectedEndTime: Date;
  track: SpotifyApi.TrackObjectFull;
  inverted?: boolean;
}
