import { useCallback, useState, type FC } from "react";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { splitInChunks, useSpotify } from "@fissa/utils";

import { useIsOwner, useShareFissa, useSpotifyTracks } from "../../../hooks";
import { useAuth } from "../../../providers";
import { api, toast } from "../../../utils";
import { Action, IconButton, Popover } from "../../shared";

export const Settings = () => {
  const { pin } = useGlobalSearchParams();
  const { push } = useRouter();

  const [showPopover, setShowPopover] = useState(false);

  const togglePopover = useCallback(() => {
    setShowPopover((prev) => !prev);
  }, []);

  const goToHome = useCallback(() => {
    togglePopover();
    push("/home");
  }, [togglePopover, push]);

  if (!pin) return null;

  return (
    <>
      <IconButton icon="setting" onPress={togglePopover} title="Actions" />
      <Popover visible={showPopover} onRequestClose={togglePopover}>
        <Action
          title="Leave Fissa"
          subtitle="No worries, you can come back"
          inverted
          onPress={goToHome}
          icon="unlink"
        />
        <CreatePlaylistAction pin={String(pin)} onRequestClose={togglePopover} />
        <PauseFissaAction />
        <ShareFissaAction pin={String(pin)} />
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

  const { data } = api.track.byPin.useQuery(pin, {
    refetchOnMount: true,
  });

  const { data: tracks = [] } = useSpotifyTracks(data?.map(({ trackId }) => trackId));

  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const handleCreatePlaylist = useCallback(async () => {
    if (!user) return;
    setIsCreatingPlaylist(true);
    await notificationAsync(NotificationFeedbackType.Success);
    onRequestClose();
    spotify
      .createPlaylist(user.id, {
        name: `Fissa ${pin}`,
        description: "Playlist created by Fissa",
      })
      .then(({ id }) => {
        const uris = tracks?.map(({ uri }) => uri) ?? [];
        const chunks = splitInChunks(uris, 100);
        chunks.forEach((chunk) => {
          void spotify.addTracksToPlaylist(id, chunk);
        });
      })
      .catch(() => {
        toast.warn({ message: "Oops, failed to create playlist..." });
      })
      .finally(() => {
        toast.success({ message: "Playlist created", icon: "🎉" });
        setIsCreatingPlaylist(false);
      });
  }, [spotify, user, tracks, onRequestClose, pin]);

  return (
    <Action
      title="Create playlist in Spotify"
      subtitle="And keep this Fissa's memories"
      inverted
      disabled={isCreatingPlaylist}
      onPress={handleCreatePlaylist}
      icon="spotify"
    />
  );
};

const PauseFissaAction = () => {
  const { pin } = useGlobalSearchParams();
  const isOwner = useIsOwner(String(pin));
  const { mutateAsync, isPending } = api.fissa.pause.useMutation({
    onSuccess: () => {
      toast.success({ message: "Fissa paused", icon: "🦥" });
    },
    onError() {
      toast.error({
        message: "Something went wrong, you can always pause Spotify to stop the Fissa!",
      });
    },
  });

  const pauseSpotify = useCallback(() => mutateAsync(String(pin)), [mutateAsync, pin]);

  if (!isOwner) return null;

  return (
    <Action
      title="Pause Fissa"
      subtitle="Nothing lasts forever"
      inverted
      disabled={isPending}
      onPress={pauseSpotify}
      icon="pause"
    />
  );
};

interface ShareFissaProps {
  pin: string;
}
const ShareFissaAction: FC<ShareFissaProps> = ({ pin }) => {
  const { shareFissa } = useShareFissa(pin);

  return (
    <Action
      title="Share Fissa"
      subtitle="Everyone secretly wants to be a DJ"
      inverted
      onPress={shareFissa}
      icon="share"
    />
  );
};
