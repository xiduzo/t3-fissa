import { FC, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter, useSearchParams } from "expo-router";
import Slider from "@react-native-community/slider";
import { useGetFissaDetails, useGetTracks } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import {
  RefetchInterval,
  splitInChunks,
  useDevices,
  useSpotify,
  useTracks,
} from "@fissa/utils";

import { useAuth } from "../../../providers";
import { mapDeviceToIcon, toast } from "../../../utils";
import { Action, Button, Divider, Popover, SelectDevice } from "../../shared";

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
        title={String(pin)}
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
        <CreatePlaylistAction
          pin={String(pin)}
          onRequestClose={togglePopover}
        />
        <SetSpeakerAction pin={String(pin)} onRequestClose={togglePopover} />
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
        toast.info({ message: "Adding fissa songs", icon: "🎶" });
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

const SetSpeakerAction: FC<ActionProps> = ({ pin, onRequestClose }) => {
  const spotify = useSpotify();
  const { user } = useAuth();
  const { devices, fetchDevices } = useDevices();
  const [selectDevice, setSelectDevice] = useState(false);

  const { data } = useGetFissaDetails(pin, RefetchInterval.Lazy);

  const toggleSelectDevice = useCallback(() => {
    setSelectDevice((prev) => !prev);
  }, []);

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      try {
        await spotify.transferMyPlayback([device.id!]);
        toast.success({
          icon: "🐋",
          message: `Connected to ${device.name}`,
        });

        toggleSelectDevice();
        onRequestClose();
      } catch (e) {
        fetchDevices();
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      }
    },
    [spotify, fetchDevices, toggleSelectDevice],
  );

  const handleVolumeChange = useCallback(
    async (volume: number) => {
      try {
        await spotify.setVolume(volume);
      } catch (e) {
        toast.error({
          message: `Failed to change volume`,
        });
      }
    },
    [spotify],
  );

  const activeSpeaker = useMemo(() => {
    return devices.find(({ is_active }) => is_active);
  }, [devices]);

  return (
    <>
      <Action
        hidden={!data || data.by.email !== user!.email}
        title={activeSpeaker?.name ?? "No active speaker"}
        subtitle="Control speaker and volume"
        inverted
        onPress={toggleSelectDevice}
        icon={mapDeviceToIcon(activeSpeaker)}
      />
      <Popover visible={selectDevice} onRequestClose={onRequestClose}>
        <SelectDevice onSelectDevice={handleDeviceSelect} inverted />
        {activeSpeaker && (
          <View className="space-y-6 py-4">
            <Divider />
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              onValueChange={handleVolumeChange}
              value={activeSpeaker?.volume_percent ?? 0}
              thumbTintColor={theme["900"]}
              maximumTrackTintColor={theme["900"] + "30"}
              minimumTrackTintColor={theme["900"] + "90"}
            />
          </View>
        )}
      </Popover>
    </>
  );
};
