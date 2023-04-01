import { FC, useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { useTracks } from "@fissa/utils";

import { useGetRoom, useGetVoteFromUser } from "../../../hooks";
import { useAuth } from "../../../providers";
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
        trackEnd={(track) => <TrackEnd trackId={track.id} pin={pin} />}
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

const TrackEnd: FC<{ trackId: string; pin: string }> = ({ pin, trackId }) => {
  const { user } = useAuth();

  const { data } = useGetVoteFromUser(pin, trackId, user);

  if (!data)
    return (
      <Ionicons
        name="ellipsis-horizontal"
        color={theme["100"] + "60"}
        size={18}
      />
    );
  if (data.vote === 1)
    return <Ionicons name="arrow-up" color={theme["500"]} size={18} />;
  if (data.vote === -1)
    return <Ionicons name="arrow-down" color={theme["500"]} size={18} />;

  return null;
};
