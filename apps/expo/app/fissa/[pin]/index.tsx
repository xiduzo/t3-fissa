import { useCallback, useState, type FC } from "react";
import { TouchableOpacity, View } from "react-native";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { theme } from "@fissa/tailwind-config";
import { useDevices, useSpotify } from "@fissa/utils";

import {
  Fab,
  FissaTracks,
  IconButton,
  PageTemplate,
  Popover,
  QuickVoteProvider,
  SelectDevice,
  Settings,
  Typography,
} from "../../../src/components";
import { useIsOwner, useOnActiveApp, useShareFissa } from "../../../src/hooks";
import { api, mapDeviceToIcon, toast } from "../../../src/utils";

const Fissa = () => {
  const { pin } = useGlobalSearchParams();
  const { replace } = useRouter();

  api.fissa.byId.useQuery(String(pin), {
    onError: (error) => {
      toast.error({ message: error.message });
      void notificationAsync(NotificationFeedbackType.Error);
      // Fissa does not exist (anymore)
      replace("/home");
    },
  });

  if (!pin) return null;

  return (
    <PageTemplate fullScreen className="max-w-screen-2xl">
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft,
          headerRight,
        }}
      />
      <QuickVoteProvider>
        <FissaTracks pin={String(pin)} />
      </QuickVoteProvider>
      <Fab title="add songs" icon="plus" linkTo={`fissa/${pin}/addTracks`} />
      <LinearGradient
        colors={["transparent", theme[900]]}
        className="absolute bottom-0 h-24 w-full"
      />
    </PageTemplate>
  );
};

export default Fissa;

const headerRight = () => <HeaderRight />;

const HeaderRight = () => {
  return (
    <View className="flex-row">
      <SpeakerButton />
      <View className="mx-3" />
      <Settings />
    </View>
  );
};

const headerLeft = () => <HeaderLeft />;

const HeaderLeft: FC = () => {
  const { pin } = useGlobalSearchParams();

  const { shareFissa } = useShareFissa(String(pin));

  return (
    <View className="grow">
      <TouchableOpacity onPress={shareFissa}>
        <Typography variant="h2">Fissa {pin}</Typography>
      </TouchableOpacity>
    </View>
  );
};

const SpeakerButton = () => {
  const spotify = useSpotify();
  const { pin } = useGlobalSearchParams();
  const isOwner = useIsOwner(String(pin));

  const { activeDevice, fetchDevices } = useDevices();

  // TODO: this call might be an unnecessary extra call even though it increases the UX.
  //       If the user decided to change the device outside of the app we are not aware of it.
  //       In this case re-fetching the devices should make sure we are aware of the current state.
  useOnActiveApp(fetchDevices);

  const [selectDevice, setSelectDevice] = useState(false);

  const toggleSelectDevice = useCallback(() => {
    setSelectDevice((prev) => !prev);
  }, []);

  const handleDeviceSelect = useCallback(
    (device: SpotifyApi.UserDevice) => async () => {
      if (!device.id) return;
      try {
        await spotify.transferMyPlayback([device.id]);
        toast.success({
          icon: "🐋",
          message: `Connected to ${device.name}`,
        });

        toggleSelectDevice();
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

  if (!isOwner) return null;

  return (
    <>
      <IconButton
        title="change device"
        icon={mapDeviceToIcon(activeDevice)}
        onPress={toggleSelectDevice}
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
