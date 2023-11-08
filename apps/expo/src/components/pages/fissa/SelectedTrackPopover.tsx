import { type FC } from "react";

import { Divider, Popover, TrackListItem } from "../../shared";
import { TrackActions } from "./TrackActions";

export const SelectedTrackPopover: FC<Props> = ({ track, onRequestClose }) => {
  return (
    <Popover visible={!!track} onRequestClose={onRequestClose}>
      {track && <TrackListItem inverted track={track} hasBorder />}
      <Divider />
      {track && <TrackActions track={track} onPress={onRequestClose} />}
    </Popover>
  );
};

interface Props {
  track?: SpotifyApi.TrackObjectFull;
  onRequestClose: () => void;
}
