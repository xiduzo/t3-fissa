import { useCallback, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import {
  BottomDrawer,
  Button,
  Popover,
  Typography,
} from "../../src/components";
import { PlaylistList } from "../../src/components/shared/PlaylistList";
import { PlaylistListItem } from "../../src/components/shared/PlaylistListItem";
import { useAuth } from "../../src/providers";

const FromPlaylist = () => {
  const { spotify } = useAuth();
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const start = useCallback(() => {
    if (!selectedPlaylist) return;
    spotify.getPlaylist(selectedPlaylist.id).then((playlist) => {
      // TODO: fetch all tracks
      console.log(playlist.tracks.items.map(({ track }) => track.id));
    });
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
