import { FC } from "react";

import { ListItem, ListItemProps } from "./ListItem";

export const PlaylistListItem: FC<Props> = ({ playlist, ...props }) => {
  return (
    <ListItem
      {...props}
      title={playlist.name}
      subtitle={`${playlist.owner?.display_name} • ${playlist.tracks.total} songs`}
      imageUri={playlist.images[0]?.url}
    />
  );
};

interface Props extends Omit<ListItemProps, "title" | "subtitle" | "imageUri"> {
  playlist: SpotifyApi.PlaylistObjectSimplified;
}
