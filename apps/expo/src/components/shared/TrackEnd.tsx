import { memo, type FC } from "react";

import { useTheme } from "../../providers";
import { Icon } from "./Icon";

export const TrackEnd: FC<{ vote?: number | null }> = memo(({ vote }) => {
  const theme = useTheme();
  if (vote === 1) return <Icon name="arrow-up" color={theme["500"]} />;
  if (vote === -1) return <Icon name="arrow-down" color={theme["500"]} />;

  return <Icon name="more-vertical" color={theme["100"] + "60"} />;
});

TrackEnd.displayName = "TrackEnd";
