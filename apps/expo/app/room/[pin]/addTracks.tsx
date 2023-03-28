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
      back();
    },
    onError: () => {
      toast.error({ message: "Failed to add tracks" });
    },
  });

  const handleAddTracks = useCallback(
    async (tracks: SpotifyApi.TrackObjectFull[]) => {
      back();
      toast.info({ message: `Adding ${tracks.length} tracks` });
      await mutateAsync(tracks);
    },
    [back],
  );

  return (
    <PickTracks
      onAddTracks={handleAddTracks}
      disabledAction={isLoading || !pin}
      actionTitle="Add tracks"
    />
  );
};

export default AddTracks;
