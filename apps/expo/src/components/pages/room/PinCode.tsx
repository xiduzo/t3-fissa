import { FC, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "expo-router";
import { splitInChunks, useTracks } from "@fissa/utils";

import { useGetRoom, useGetTracks } from "../../../hooks";
import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Action, Button, Popover } from "../../shared";

export const PinCode = () => {
  const { pin } = useSearchParams();
  const { push } = useRouter();
  const { user, promptAsync } = useAuth();

  const [showRoomPopover, setShowRoomPopover] = useState(false);

  const toggleRoomPopover = useCallback(() => {
    setShowRoomPopover((prev) => !prev);
  }, []);

  const goToHome = useCallback(() => {
    toggleRoomPopover();
    push("/");
  }, []);

  if (!pin) return null;

  return (
    <>
      <Button
        onPress={toggleRoomPopover}
        dimmed
        title={pin!}
        size="sm"
        variant="text"
        icon="information-circle-outline"
      />
      <Popover visible={showRoomPopover} onRequestClose={toggleRoomPopover}>
        {user && (
          <Button
            inverted
            variant="text"
            title="Sign in to create a playlist"
            className="mb-4"
            onPress={() => promptAsync()}
          />
        )}
        <Action
          title="Leave session"
          subtitle="No worries, you can come back"
          inverted
          onPress={goToHome}
          icon="arrow-up"
        />
        <CreatePlaylistAction pin={pin} onRequestClose={toggleRoomPopover} />
        <SetSpeakerAction pin={pin} onRequestClose={toggleRoomPopover} />
      </Popover>
    </>
  );
};

interface ActionProps {
  pin: string;
  onRequestClose: () => void;
}

const CreatePlaylistAction: FC<ActionProps> = ({ pin, onRequestClose }) => {
  const { user, spotify } = useAuth();

  const { data } = useGetTracks(pin);

  const tracks = useTracks(data?.map(({ trackId }) => trackId));

  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const handleCreatePlaylist = useCallback(async () => {
    if (!user) return;
    setIsCreatingPlaylist(true);
    toast.info({ message: "Creating playlist" });
    onRequestClose();
    spotify
      .createPlaylist(user.id, {
        name: `Fissa ${pin}`,
        description: "Playlist created by Fissa",
      })
      .then(({ id }) => {
        toast.info({ message: "Adding fissa tracks", icon: "🎶" });
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
      disabled={!user || isCreatingPlaylist}
      onPress={handleCreatePlaylist}
      icon="musical-note"
    />
  );
};

const SetSpeakerAction: FC<ActionProps> = ({ pin }) => {
  const { user, spotify } = useAuth();
  const { data } = useGetRoom(pin);

  const [speakers, setSpeakers] = useState<SpotifyApi.UserDevice[]>([]);

  useEffect(() => {
    if (!user) return;

    spotify.getMyDevices().then(({ devices }) => {
      setSpeakers(devices);
    });
  }, [user, spotify]);

  return (
    <Action
      hidden={!data || !user || data.by.email !== user.email}
      title={
        speakers.find((speaker) => speaker.name)?.name ?? "No active speaker"
      }
      subtitle="Current speaker"
      inverted
      // disabled={!speakers.length}
      disabled
      icon="headset"
    />
  );
};
