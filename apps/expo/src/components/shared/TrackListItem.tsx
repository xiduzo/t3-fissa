import { FC } from "react";

import { ListItem, ListItemProps } from "./ListItem";

interface Props extends Omit<ListItemProps, "title" | "subtitle" | "imageUri"> {
  track: SpotifyApi.TrackObjectFull;
}

export const TrackListItem: FC<Props> = ({ track, ...props }) => {
  if (!track) return null;

  return (
    <ListItem
      {...props}
      title={track.name}
      subtitle={track.artists.map((artist) => artist.name).join(", ")}
      imageUri={track.album.images[0]?.url}
    />
  );
};
