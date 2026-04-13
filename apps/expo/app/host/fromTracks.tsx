import { useCallback } from "react";

import { PickTracks } from "../../src/components";
import { useCreateFissa } from "../../src/hooks";

const FromTracks = () => {
  const { mutateAsync, isPending } = useCreateFissa();

  const handleAddTracks = useCallback(
    async (tracks: SpotifyApi.TrackObjectFull[]) => {
      await mutateAsync(tracks);
    },
    [mutateAsync],
  );

  return (
    <PickTracks
      onAddTracks={handleAddTracks}
      disabledAction={isPending}
      actionTitle="Start fissa"
    />
  );
};

export default FromTracks;
