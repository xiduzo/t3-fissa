import { FC } from "react";

import { Divider, Popover, TrackListItem } from "../../shared";
import { TrackActions } from "./TrackActions";

export const SelectedTrackPopover: FC<Props> = ({ currentTrackIndex, track, onRequestClose }) => {
  return (
    <Popover visible={!!track} onRequestClose={onRequestClose}>
      {track && <TrackListItem inverted track={track} hasBorder />}
      <Divider />
      {track && (
        <TrackActions
          currentTrackIndex={currentTrackIndex}
          track={track}
          onPress={onRequestClose}
        />
      )}
    </Popover>
  );
};

interface Props {
  track?: SpotifyApi.TrackObjectFull;
  currentTrackIndex: number;
  onRequestClose: () => void;
}
