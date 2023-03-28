import { useCallback } from "react";



import { PickTracks } from "../../src/components";
import { useCreateRoom } from "../../src/components/pages/room/hooks/useCreateRoom";
import { toast } from "../../src/utils";


const FromTracks = () => {
  const { mutateAsync, isLoading } = useCreateRoom();

  const handleAddTracks = useCallback(
    async (tracks: SpotifyApi.TrackObjectFull[]) => {
      toast.info({ message: `Starting fissa with ${tracks.length} tracks` });

      const mappedTracks = tracks.map((track) => ({
        durationMs: track.duration_ms,
        trackId: track.id,
      }));

      await mutateAsync(mappedTracks);
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