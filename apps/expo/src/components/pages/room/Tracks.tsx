import { useState } from "react";
import { useSearchParams } from "expo-router";
import { useTracks } from "@fissa/utils";

import { useGetRoom, useGetTracks } from "../../../hooks";
import { Divider, Popover, TrackList, TrackListItem } from "../../shared";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { ListHeaderComponent } from "./ListHeaderComponent";
import { VoteActions } from "./VoteActions";

export const RoomTracks = () => {
  const { pin } = useSearchParams();

  const { data, isInitialLoading } = useGetTracks(pin!);
  const { data: room } = useGetRoom(pin!);
  const tracks = useTracks(data?.map(({ trackId }) => trackId));

  const [selectedTrack, setSelectedTrack] =
    useState<SpotifyApi.TrackObjectFull | null>(null);

  const isPlaying = (room?.currentIndex ?? -1) >= 0;

  return (
    <>
      <TrackList
        tracks={
          isPlaying
            ? tracks.slice((room?.currentIndex ?? 0) + 1, tracks.length)
            : []
        }
        onTrackPress={setSelectedTrack}
        ListHeaderComponent={<ListHeaderComponent tracks={tracks} />}
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={isInitialLoading || tracks.length !== data?.length}
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
        <TrackListItem inverted track={selectedTrack!} hasBorder />
        <Divider />
        <VoteActions
          track={selectedTrack!}
          onPress={() => setSelectedTrack(null)}
        />
      </Popover>
    </>
  );
};
