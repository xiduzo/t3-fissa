import { FC, useCallback, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter, useSearchParams } from "expo-router";
import Slider from "@react-native-community/slider";
import { useGetFissaDetails, useGetTracks } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import { RefetchInterval, splitInChunks, useDevices, useSpotify, useTracks } from "@fissa/utils";

import { useAuth } from "../../../providers";
import { mapDeviceToIcon, toast } from "../../../utils";
import { Action, Button, Popover, SelectDevice } from "../../shared";

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
        title={String(pin)}
        variant="text"
        className="absolute right-8 top-12 z-50 py-0"
      />
      <Popover visible={showPopover} onRequestClose={togglePopover}>
        <Action
          title="Leave fissa"
          subtitle="No worries, you can come back"
          inverted
          onPress={goToHome}
          icon="unlink"
        />
        <CreatePlaylistAction pin={String(pin)} onRequestClose={togglePopover} />
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

const SetSpeakerAction: FC<ActionProps> = ({ pin, onRequestClose }) => {
  const spotify = useSpotify();
  const { user } = useAuth();
  const { activeDevice, fetchDevices } = useDevices();
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
        toast.error({
          message: `Failed to connect to ${device.name}`,
        });
      } finally {
        fetchDevices();
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

  return (
    <>
      <Action
        hidden={!data || data.by.email !== user!.email}
        title={activeDevice?.name ?? "No active device"}
        subtitle="Control device and volume"
        inverted
        onPress={toggleSelectDevice}
        icon={mapDeviceToIcon(activeDevice)}
      />
      <Popover visible={selectDevice} onRequestClose={toggleSelectDevice}>
        <SelectDevice onSelectDevice={handleDeviceSelect} inverted />
        {activeDevice && (
          <View className="space-y-6 py-4">
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              onValueChange={handleVolumeChange}
              value={activeDevice?.volume_percent ?? 0}
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
