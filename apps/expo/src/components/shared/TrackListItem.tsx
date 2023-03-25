import { FC } from "react";

import { ListItem, ListItemProps } from "./ListItem";

export const TrackListItem: FC<Props> = ({ track, ...props }) => {
  return (
    <ListItem
      {...props}
      title={track.name}
      subtitle={track.artists.map((artist) => artist.name).join(", ")}
      imageUri={track.album.images[0]?.url}
    />
  );
};

interface Props extends Omit<ListItemProps, "title" | "subtitle" | "imageUri"> {
  track: SpotifyApi.TrackObjectFull;
}
