import { FC, useCallback, useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter, useSearchParams } from "expo-router";
import { useGetTracks } from "@fissa/hooks";
import { splitInChunks, useSpotify, useTracks } from "@fissa/utils";

import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Action, IconButton, Popover } from "../../shared";

export const PinCode = () => {
  const { pin } = useSearchParams();
  const { push } = useRouter();

  const [showPopover, setShowPopover] = useState(false);

  const togglePopover = useCallback(() => {
    setShowPopover((prev) => !prev);
  }, []);

  const goToHome = useCallback(() => {
    togglePopover();
    push("/home");
  }, []);

  if (!pin) return null;

  return (
    <>
      <IconButton icon="setting" onPress={togglePopover} title={`Fissa ${pin} settings`} />
      <Popover visible={showPopover} onRequestClose={togglePopover}>
        <Action
          title="Leave fissa"
          subtitle="No worries, you can come back"
          inverted
          onPress={goToHome}
          icon="unlink"
        />
        <CreatePlaylistAction pin={String(pin)} onRequestClose={togglePopover} />
      </Popover>
    </>
  );
};

interface ActionProps {
  pin: string;
  onRequestClose: () => void;
}

const CreatePlaylistAction: FC<ActionProps> = ({ pin, onRequestClose }) => {
  const { user } = useAuth();
  const spotify = useSpotify();

  const { data } = useGetTracks(pin);

  const tracks = useTracks(data?.map(({ trackId }) => trackId));

  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const handleCreatePlaylist = useCallback(async () => {
    setIsCreatingPlaylist(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRequestClose();
    spotify
      .createPlaylist(user!.id, {
        name: `Fissa ${pin}`,
        description: "Playlist created by Fissa",
      })
      .then(({ id }) => {
        const uris = tracks?.map(({ uri }) => uri) ?? [];
        const chunks = splitInChunks(uris, 100);
        chunks.forEach((chunk) => {
          spotify.addTracksToPlaylist(id, chunk);
        });
      })
      .finally(() => {
        toast.success({ message: "Playlist created", icon: "🎉" });
        setIsCreatingPlaylist(false);
      });
  }, [spotify, user, tracks, onRequestClose]);

  return (
    <Action
      title="Create playlist in spotify"
      subtitle="And keep this fissa's memories"
      inverted
      disabled={isCreatingPlaylist}
      onPress={handleCreatePlaylist}
      icon="spotify"
    />
  );
};
