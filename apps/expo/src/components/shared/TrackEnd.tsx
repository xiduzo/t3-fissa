import { FC } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { useGetVoteFromUser } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";

import { useAuth } from "../../providers";

export const TrackEnd: FC<{ trackId: string; pin: string }> = ({
  pin,
  trackId,
}) => {
  const { user } = useAuth();

  const { data } = useGetVoteFromUser(pin, trackId, user);

  if (!data)
    return (
      <FontAwesome name="ellipsis-v" color={theme["100"] + "60"} size={18} />
    );
  if (data.vote === 1)
    return <FontAwesome name="arrow-up" color={theme["500"]} size={18} />;
  if (data.vote === -1)
    return <FontAwesome name="arrow-down" color={theme["500"]} size={18} />;

  return null;
};
