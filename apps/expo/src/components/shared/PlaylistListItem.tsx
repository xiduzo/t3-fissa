import { type FC } from "react";

import { ListItem, type ListItemProps } from "./ListItem";

export const PlaylistListItem: FC<Props> = ({ playlist, ...props }) => {
  return (
    <ListItem
      accessibilityLabel={`${playlist.name} by ${playlist.owner?.display_name}, contains ${playlist.tracks.total} songs`}
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
