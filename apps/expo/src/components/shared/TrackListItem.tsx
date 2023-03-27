import { FC, memo } from "react";

import { ListItem, ListItemProps } from "./ListItem";

export const TrackListItem: FC<Props> = memo(
  ({ track, ...props }) => {
    return (
      <ListItem
        {...props}
        title={track.name}
        subtitle={track.artists.map((artist) => artist.name).join(", ")}
        imageUri={track.album.images[0]?.url}
      />
    );
  },
  (prev, next) =>
    prev.track.id === next.track.id && prev.selected === next.selected,
);

interface Props extends Omit<ListItemProps, "title" | "subtitle" | "imageUri"> {
  track: SpotifyApi.TrackObjectFull;
}
