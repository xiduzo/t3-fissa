import { useCallback } from "react";

import { PickTracks } from "../../src/components";
import { useCreateFissa } from "../../src/hooks";

const FromTracks = () => {
  const { mutateAsync, isLoading } = useCreateFissa();

  const handleAddTracks = useCallback(async (tracks: SpotifyApi.TrackObjectFull[]) => {
    await mutateAsync(tracks);
  }, []);

  return <PickTracks onAddTracks={handleAddTracks} disabledAction={isLoading} actionTitle="Start fissa" />;
};

export default FromTracks;
