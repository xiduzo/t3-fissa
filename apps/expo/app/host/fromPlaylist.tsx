import { useCallback, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import {
  Button,
  PlaylistList,
  PlaylistListItem,
  Popover,
  Typography,
} from "../../src/components";
import { useCreateRoom } from "../../src/hooks";
import { useAuth } from "../../src/providers";
import { toast } from "../../src/utils";

const FromPlaylist = () => {
  const { spotify } = useAuth();

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const { mutateAsync } = useCreateRoom();

  const start = useCallback(async () => {
    if (!selectedPlaylist) return;

    await mutateAsync(undefined, {
      onSuccess: async () => {
        toast.success({ message: "Room created" });
      },
      onError: (error) => {
        toast.error({ message: error.message });
      },
    });
    // spotify.getPlaylist(selectedPlaylist.id).then((playlist) => {
    //   // TODO: fetch all tracks
    //   console.log(playlist.tracks.items.map(({ track }) => track.id));
    // });
  }, [selectedPlaylist]);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View className="flex h-full justify-between">
        <Typography variant="h1" className="px-6 pb-8 pt-4">
          Select playlist
        </Typography>
        <PlaylistList onPlaylistPress={setSelectedPlaylist} />
      </View>
      <Popover
        visible={!!selectedPlaylist}
        onRequestClose={() => setSelectedPlaylist(null)}
      >
        <Typography variant="h2" centered inverted className="mb-8">
          Your fissa will start based on
        </Typography>
        <PlaylistListItem
          playlist={selectedPlaylist!}
          hasBorder
          inverted
          className="mb-8"
        />
        <Button title="Let's kick it" inverted onPress={start} />
      </Popover>
    </SafeAreaView>
  );
};

export default FromPlaylist;
