import { type FC } from "react";
import { theme } from "@fissa/tailwind-config";

import { useGetVoteFromUser } from "../../hooks";
import { useAuth } from "../../providers";
import { Icon } from "./Icon";

export const TrackEnd: FC<{ trackId: string; pin: string }> = ({ pin, trackId }) => {
  const { user } = useAuth();

  const { data } = useGetVoteFromUser(pin, trackId, user);

  if (!data) return <Icon name="more-vertical" color={theme["100"] + "60"} />;
  if (data.vote === 1) return <Icon name="arrow-up" color={theme["500"]} />;
  if (data.vote === -1) return <Icon name="arrow-down" color={theme["500"]} />;

  return null;
};
