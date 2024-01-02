import { useCallback, useState, type FC } from "react";
import { Linking, View } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { useDevices } from "@fissa/utils";

import { useOnActiveApp } from "../../hooks";
import { mapDeviceToIcon } from "../../utils";
import { Button } from "./button";
import { Divider } from "./Divider";
import { EmptyState } from "./EmptyState";
import { Popover } from "./Popover";
import { Typography } from "./Typography";

export const SelectDevice: FC<Props> = ({ onSelectDevice, inverted }) => {
  const { devices, fetchDevices } = useDevices();
  useOnActiveApp(() => {
    fetchDevices();
  });

  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
    fetchDevices();
  }, [fetchDevices]);

  const openSpotify = useCallback(async () => {
    await Linking.openURL("spotify://");
    toggleHelp();
  }, [toggleHelp]);

  return (
    <>
      <View className="space-y-2">
        {!devices.length && <EmptyState title="No devices found" icon="🦀" />}
        {devices
          .filter(({ id }) => !!id)
          .map((device) => (
            <Button
              inverted={inverted}
              key={device.id}
              icon={mapDeviceToIcon(device)}
              variant="text"
              title={device.name}
              onPress={onSelectDevice(device)}
              accessibilityLabel={`Play via ${device.name}, ${device.type}`}
              className="flex-row items-center justify-start px-8"
            />
          ))}
      </View>
      <Divider />
      <Button
        inverted={inverted}
        icon="question"
        variant="text"
        title="I can't find my device"
        onPress={toggleHelp}
      />
      <Popover visible={showHelp} onRequestClose={toggleHelp}>
        <Typography centered variant="h2" inverted>
          Follow the steps below
        </Typography>
        <View className="mx-4 my-6 space-y-3">
          <View className="flex-row space-x-2">
            <View className="overflow-hidden rounded-full">
              <Typography className="px-1.5" style={{ backgroundColor: theme["900"] }}>
                1
              </Typography>
            </View>
            <Typography inverted>
              <Typography inverted className="mr-1 font-bold">
                Open spotify
              </Typography>{" "}
              via the button below
            </Typography>
          </View>
          <View className="flex-row space-x-2">
            <View className="overflow-hidden rounded-full">
              <Typography className="px-1.5" style={{ backgroundColor: theme["900"] }}>
                2
              </Typography>
            </View>
            <Typography inverted>
              <Typography inverted className="mr-1 font-bold">
                Select your device
              </Typography>{" "}
              via the Spotify player
            </Typography>
          </View>
          <View className="flex-row space-x-2">
            <View className="overflow-hidden rounded-full">
              <Typography className="px-1.5" style={{ backgroundColor: theme["900"] }}>
                3
              </Typography>
            </View>
            <Typography inverted>
              <Typography inverted className="mr-1 font-bold">
                Come back
              </Typography>{" "}
              to the fissa app
            </Typography>
          </View>
        </View>
        <Button inverted title="Open spotify" onPress={openSpotify} />
      </Popover>
    </>
  );
};

interface Props {
  onSelectDevice: (device: SpotifyApi.UserDevice) => () => Promise<void>;
  inverted?: boolean;
}
