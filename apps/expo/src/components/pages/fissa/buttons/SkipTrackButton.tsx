import { useGlobalSearchParams } from "expo-router";
import { useSkipTrack } from "@fissa/hooks";

import { toast } from "../../../../utils";
import { IconButton } from "../../../shared";

export const SkipTrackButton = () => {
  const { pin } = useGlobalSearchParams();

  const { mutateAsync, isLoading } = useSkipTrack(String(pin), {
    onMutate: () => {
      toast.info({
        icon: "🐍",
        message: "Ssssssssskipping song",
        duration: 10000,
      });
    },
    onSettled: () => {
      toast.hide();
    },
  });

  return (
    <IconButton
      onPress={mutateAsync}
      disabled={isLoading}
      title="play next song"
      icon="skip-forward"
    />
  );
};
