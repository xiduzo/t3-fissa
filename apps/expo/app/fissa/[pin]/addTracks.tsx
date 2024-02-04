import { useCallback } from "react";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { sortFissaTracksOrder } from "@fissa/utils";

import { PickTracks } from "../../../src/components/shared";
import { api, toast } from "../../../src/utils";

const AddTracks = () => {
  const { pin } = useGlobalSearchParams();
  const queryClient = api.useContext();

  const { back } = useRouter();

  const { mutateAsync, isLoading } = api.track.addTracks.useMutation({
    onError: () => {
      toast.error({ message: "Failed to add songs" });
    },
    onMutate: async ({ tracks, pin }) => {
      const newTrackIds = tracks.map((track) => track.trackId);
      await queryClient.fissa.byId.cancel(pin);
      queryClient.fissa.byId.setData(
        pin,
        (prev) =>
          prev && {
            ...prev,
            tracks: sortFissaTracksOrder([
              ...tracks.map((track) => ({
                by: null,
                lastUpdateAt: new Date(),
                createdAt: new Date(),
                hasBeenPlayed: false,
                score:
                  (prev.tracks.find(({ trackId }) => trackId === track.trackId)?.score ?? 0) + 1,
                pin: pin,
                trackId: track.trackId,
                durationMs: track.durationMs,
                totalScore: 0,
                userId: null,
              })),
              ...prev.tracks.filter(({ trackId }) => !newTrackIds.includes(trackId)),
            ]),
          },
      );

      tracks.forEach((track) => {
        const vote = { trackId: track.trackId, pin: pin };

        queryClient.vote.byTrackFromUser.setData(
          vote,
          (prev) =>
            prev && {
              ...prev,
              vote: 1,
            },
        );
      });

      toast.success({ message: `Added ${tracks.length} songs` });
      back();
    },
    onSettled: async (data, _, variables) => {
      for (const track of variables.tracks) {
        const vote = { trackId: track.trackId, pin: variables.pin };

        await queryClient.vote.byTrackFromUser.invalidate(vote);
      }

      await queryClient.fissa.byId.invalidate(variables.pin);
    },
  });

  const handleAddTracks = useCallback(
    async (tracks: SpotifyApi.TrackObjectFull[]) => {
      tracks.map((x) => x.duration_ms);
      await mutateAsync({
        pin: String(pin),
        tracks: tracks.map((track) => ({
          trackId: track.id,
          durationMs: track.duration_ms,
        })),
      });
    },
    [pin, mutateAsync],
  );

  return (
    <PickTracks
      onAddTracks={handleAddTracks}
      disabledAction={isLoading || !pin}
      actionTitle="Add songs"
    />
  );
};

export default AddTracks;
