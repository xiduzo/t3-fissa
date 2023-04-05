import { useCallback } from "react";
import { useRouter, useSearchParams } from "expo-router";

import { PickTracks } from "../../../src/components/shared";
import { useAddTracks } from "../../../src/hooks";
import { toast } from "../../../src/utils";

const AddTracks = () => {
  const { pin } = useSearchParams();

  const { back } = useRouter();

  const { mutateAsync, isLoading } = useAddTracks(String(pin), {
    onSuccess: () => {
      toast.success({ message: "Tracks added to queue" });
    },
    onError: () => {
      toast.error({ message: "Failed to add tracks" });
    },
    onMutate: ({ tracks }) => {
      toast.info({ message: `Adding ${tracks.length} tracks` });
      back();
    },
  });

  return (
    <PickTracks
      onAddTracks={mutateAsync}
      disabledAction={isLoading || !pin}
      actionTitle="Add tracks"
    />
  );
};

export default AddTracks;
