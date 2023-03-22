import { FC, useCallback, useState } from "react";
import { SafeAreaView, View, VirtualizedList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import Action from "../../src/components/Action";
import { Button } from "../../src/components/Button";
import ListItem from "../../src/components/ListItem";
import Popover from "../../src/components/Popover";
import { Typography } from "../../src/components/Typography";

const Room = () => {
  const { pin } = useSearchParams();

  const [showRoomPopover, setShowRoomPopover] = useState(false);

  const toggleRoomPopover = useCallback(() => {
    setShowRoomPopover((prev) => !prev);
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mt-6 flex h-full w-full">
        <View className="flex-row items-center justify-between px-6">
          <Typography variant="h2">Now Playing</Typography>
          <Button
            onPress={toggleRoomPopover}
            className="opacity-60"
            title={pin!}
            variant="text"
            endIcon="information-circle-outline"
          />
        </View>
        <VirtualizedList
          className="px-6"
          data={[
            {
              id: 1,
              name: "test",
            },
          ]}
          getItemCount={() => 25}
          getItem={(data, index) => data[index]}
          renderItem={(render) => (
            <ListItem
              title="test"
              subtitle="test"
              // imageUri="https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png"
            />
          )}
          keyExtractor={(item, index) => index}
          initialNumToRender={5}
          ListFooterComponent={ListFooterComponent}
        />
        <RoomPopover visible={showRoomPopover} close={toggleRoomPopover} />
        <LinearGradient
          colors={["transparent", theme[900]]}
          className="absolute bottom-0 h-24 w-full"
        />
      </View>
    </SafeAreaView>
  );
};

export default Room;

const ListFooterComponent = () => {
  return (
    <View className="mb-36 flex items-center justify-center py-24">
      <Typography variant="h1" className="mb-4">
        🦦
      </Typography>
      <Typography variant="bodyM">Add tracks or I'll fill the queue</Typography>
    </View>
  );
};

const RoomPopover: FC<{ visible: boolean; close: () => void }> = ({
  visible,
  close,
}) => {
  const { back } = useRouter();

  const goToHome = useCallback(() => {
    close();
    back();
  }, [close, back]);

  return (
    <Popover visible={visible} onRequestClose={close}>
      <Action
        title="Leave session"
        subtitle="No worries, you can come back"
        inverted
        onPress={goToHome}
        icon="arrow-up"
      />
      <Action
        title="Create playlist in spotify"
        subtitle="And keep this fissa's memories"
        inverted
        disabled
        // onPress={createPlaylist}
        // disabled={!currentUser || savingPlaylist}
        icon="musical-note"
      />
      <Action
        // hidden={!isOwner}
        title={"No speakers found"}
        subtitle="Current speaker"
        inverted
        disabled
        icon="headset"
        // onPress={toggleDevicePopover}
      />
    </Popover>
  );
};
