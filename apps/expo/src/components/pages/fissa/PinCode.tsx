import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "expo-router";
import { splitInChunks, useSpotify, useTracks } from "@fissa/utils";

import { useGetFissaDetails, useGetTracks } from "../../../hooks";
import { useAuth } from "../../../providers";
import { mapDeviceToIcon, toast } from "../../../utils";
import { Action, Button, Popover } from "../../shared";

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
      <Button
        onPress={togglePopover}
        dimmed
        title={pin}
        size="sm"
        variant="text"
      />
      <Popover visible={showPopover} onRequestClose={togglePopover}>
        <Action
          title="Leave fissa"
          subtitle="No worries, you can come back"
          inverted
          onPress={goToHome}
          icon="unlink"
        />
        <CreatePlaylistAction pin={pin} onRequestClose={togglePopover} />
        <SetSpeakerAction pin={pin} onRequestClose={togglePopover} />
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
    toast.info({ message: "Creating playlist" });
    onRequestClose();
    spotify
      .createPlaylist(user!.id, {
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
      disabled={isCreatingPlaylist}
      onPress={handleCreatePlaylist}
      icon="spotify"
    />
  );
};

const SetSpeakerAction: FC<ActionProps> = ({ pin }) => {
  const spotify = useSpotify();
  const { user } = useAuth();

  const { data } = useGetFissaDetails(pin);

  const [speakers, setSpeakers] = useState<SpotifyApi.UserDevice[]>([]);

  const activeSpeaker = useMemo(() => {
    return speakers.find((speaker) => speaker.is_active);
  }, [speakers]);

  useEffect(() => {
    spotify.getMyDevices().then(({ devices }) => {
      setSpeakers(devices);
    });
  }, [spotify]);

  return (
    <Action
      hidden={!data || data.by.email !== user!.email}
      title={activeSpeaker?.name ?? "No active speaker"}
      subtitle="Current speaker"
      inverted
      // disabled={!speakers.length}
      disabled
      icon={mapDeviceToIcon(activeSpeaker)}
    />
  );
};