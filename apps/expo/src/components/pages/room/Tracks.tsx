import { FC, useCallback, useMemo, useState } from "react";
import { useTracks } from "@fissa/utils";

import { useGetRoom } from "../../../hooks";
import { Divider, Popover, TrackList, TrackListItem } from "../../shared";
import { Badge } from "../../shared/Badge";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { ListHeaderComponent } from "./ListHeaderComponent";
import { VoteActions } from "./VoteActions";

export const RoomTracks: FC<{ pin: string }> = ({ pin }) => {
  const { data, isInitialLoading } = useGetRoom(pin);

  const localTracks = useTracks(data?.tracks.map(({ trackId }) => trackId));

  const [selectedTrack, setSelectedTrack] =
    useState<SpotifyApi.TrackObjectFull | null>(null);

  const isPlaying = (data?.currentIndex ?? -1) >= 0;

  const getTrackVotes = useCallback(
    (track: SpotifyApi.TrackObjectFull) => {
      return (
        data?.tracks.find(({ trackId }) => trackId === track.id)?.score ?? 0
      );
    },
    [data?.tracks],
  );

  const tracks = useMemo(() => {
    return localTracks.slice((data?.currentIndex ?? 0) + 1, localTracks.length);
  }, [localTracks, data?.currentIndex]);

  return (
    <>
      <TrackList
        tracks={isPlaying ? tracks : []}
        getTrackVotes={getTrackVotes}
        onTrackPress={setSelectedTrack}
        ListHeaderComponent={
          <ListHeaderComponent
            queue={tracks.length}
            activeTrack={localTracks[data?.currentIndex ?? 0]}
          />
        }
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={
              isInitialLoading || tracks.length !== data?.tracks.length
            }
          />
        }
        ListFooterComponent={
          Boolean(tracks.length) && isPlaying && !isInitialLoading ? (
            <ListFooterComponent />
          ) : null
        }
      />
      <Popover
        visible={!!selectedTrack}
        onRequestClose={() => setSelectedTrack(null)}
      >
        {selectedTrack && (
          <TrackListItem
            inverted
            track={selectedTrack}
            subtitlePrefix={
              <Badge inverted amount={getTrackVotes(selectedTrack)} />
            }
            hasBorder
          />
        )}
        <Divider />
        <VoteActions
          track={selectedTrack!}
          onPress={() => setSelectedTrack(null)}
        />
      </Popover>
    </>
  );
};
