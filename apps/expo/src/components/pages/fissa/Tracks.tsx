import { FC, useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, GestureResponderEvent, View } from "react-native";
import { useTracks } from "@fissa/utils";

import { useCreateVote, useGetFissa } from "../../../hooks";
import { toast } from "../../../utils";
import {
  Divider,
  Popover,
  TrackEnd,
  TrackList,
  TrackListItem,
} from "../../shared";
import { Badge } from "../../shared/Badge";
import { ListEmptyComponent } from "./ListEmptyComponent";
import { ListFooterComponent } from "./ListFooterComponent";
import { ListHeaderComponent } from "./ListHeaderComponent";
import { QuickVoteModal } from "./QuickVoteModal";
import { VoteActions } from "./VoteActions";

const windowHeight = Dimensions.get("window").height;
const windowCenter = windowHeight / 2;

export const FissaTracks: FC<{ pin: string }> = ({ pin }) => {
  const { data, isInitialLoading } = useGetFissa(pin);
  const focussedPosition = useRef(0);
  const [vote, setVote] = useState(0);
  const [focussedTrack, setFocussedTrack] =
    useState<SpotifyApi.TrackObjectFull>();

  const localTracks = useTracks(data?.tracks.map(({ trackId }) => trackId));

  const [selectedTrack, setSelectedTrack] =
    useState<SpotifyApi.TrackObjectFull | null>(null);

  const { mutateAsync } = useCreateVote(String(pin), {
    onMutate: ({ vote }) => {
      toast.success({
        message: focussedTrack!.name,
        icon: vote > 0 ? "👆" : "👇",
      });
    },
  });

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

  const toggleLongPress = useCallback(
    (track?: SpotifyApi.TrackObjectFull) =>
      async (event: GestureResponderEvent) => {
        focussedPosition.current = event.nativeEvent.pageY;

        setFocussedTrack(track);
        setVote(0);
      },
    [],
  );

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      if (vote !== 0 && focussedTrack) {
        mutateAsync(vote, focussedTrack.id);
      }

      toggleLongPress(undefined)(event);
    },
    [toggleLongPress, focussedTrack, vote],
  );

  const handleTouchMove = useCallback((event: GestureResponderEvent) => {
    const TRIGGER_DIFF = 100;

    const { pageY } = event.nativeEvent;

    if (pageY < windowCenter - TRIGGER_DIFF) return setVote(1);
    if (pageY > windowCenter + TRIGGER_DIFF) return setVote(-1);

    setVote(0);
  }, []);

  return (
    <>
      <TrackList
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        scrollEnabled={!focussedTrack}
        tracks={isPlaying ? tracks : []}
        getTrackVotes={getTrackVotes}
        onTrackPress={setSelectedTrack}
        onTrackLongPress={toggleLongPress}
        trackEnd={(track) => <TrackEnd trackId={track.id} pin={pin} />}
        ListHeaderComponent={
          <ListHeaderComponent
            queue={tracks.length}
            activeTrack={localTracks[data?.currentIndex ?? 0]}
          />
        }
        ListEmptyComponent={
          <View className="mx-6">
            <ListEmptyComponent isLoading={isInitialLoading} />
          </View>
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
      <QuickVoteModal
        focussedPosition={focussedPosition.current}
        getTrackVotes={getTrackVotes}
        vote={vote}
        track={focussedTrack}
        onTouchEnd={handleTouchEnd}
      />
    </>
  );
};
