import { FC, useEffect, useState } from "react";
import { VirtualizedList, VirtualizedListProps } from "react-native";

import { Badge } from "./Badge";
import { TrackListItem } from "./TrackListItem";

export const TrackList: FC<Props> = ({
  tracks,
  onTrackPress,
  selectedTracks,
  getTrackVotes,
  trackEnd,
  ...props
}) => {
  return (
    <VirtualizedList
      {...props}
      className="px-6"
      data={tracks}
      getItemCount={() => tracks.length}
      initialNumToRender={5}
      renderItem={({ item, index }) => (
        <TrackListItem
          key={item.id}
          index={index}
          track={item}
          subtitlePrefix={
            <TrackVotes getTrackVotes={getTrackVotes} track={item} />
          }
          end={trackEnd && trackEnd(item)}
          onPress={() => onTrackPress?.(item)}
          selected={selectedTracks?.includes(item.id)}
        />
      )}
      getItem={getItem}
      keyExtractor={keyExtractor}
    />
  );
};

export type TrackListProps = Props;

const TrackVotes: FC<
  Pick<Props, "getTrackVotes"> & { track: SpotifyApi.TrackObjectFull }
> = ({ getTrackVotes, track }) => {
  const [votes, setVotes] = useState<number | null>(null);

  useEffect(() => {
    if (!getTrackVotes) return;
    setVotes(getTrackVotes(track));
  }, [getTrackVotes, track]);

  if (votes === null) return null;

  return <Badge amount={votes} />;
};

interface Props
  extends Omit<
    VirtualizedListProps<SpotifyApi.TrackObjectFull>,
    | "getItemCount"
    | "initialNumToRender"
    | "getItem"
    | "keyExtractor"
    | "renderItem"
  > {
  tracks: SpotifyApi.TrackObjectFull[];
  selectedTracks?: string[];
  getTrackVotes?: (track: SpotifyApi.TrackObjectFull) => number;
  trackEnd?: (track: SpotifyApi.TrackObjectFull) => JSX.Element;
  onTrackPress?: (track: SpotifyApi.TrackObjectFull) => void;
}

const getItem = (data: SpotifyApi.TrackObjectFull[], index: number) =>
  data[index]!;
const keyExtractor = (track: SpotifyApi.TrackObjectFull, index: number) =>
  track?.id ?? index;
