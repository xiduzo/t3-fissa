import { useCallback } from "react";

import { PickTracks } from "../../src/components";
import { useCreateFissa } from "../../src/components/pages/fissa/hooks/useCreateFissa";
import { toast } from "../../src/utils";

const FromTracks = () => {
  const { mutateAsync, isLoading } = useCreateFissa();

  const handleAddTracks = useCallback(
    async (tracks: SpotifyApi.TrackObjectFull[]) => {
    toast.info({ message: `Starting your fissa based on ${tracks.length} tracks` });

      await mutateAsync(
        tracks.map((track) => ({
          durationMs: track.duration_ms,
          trackId: track.id,
        })),
      );
    },
    [],
  );

  return (
    <PickTracks
      onAddTracks={handleAddTracks}
      disabledAction={isLoading}
      actionTitle="Start fissa"
    />
  );
};

export default FromTracks;
