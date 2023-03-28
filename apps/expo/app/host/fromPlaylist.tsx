import { useCallback, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { getPlaylistTracks } from "@fissa/utils";

import {
  Button,
  PlaylistList,
  PlaylistListItem,
  Popover,
  Typography,
} from "../../src/components";
import { useCreateRoom } from "../../src/components/pages/room/hooks/useCreateRoom";
import { useSpotify } from "../../src/providers";
import { toast } from "../../src/utils";

const FromPlaylist = () => {
  const spotify = useSpotify();

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const { mutateAsync, isLoading } = useCreateRoom();

  const start = useCallback(async () => {
    toast.info({
      message: `Starting fissa based on ${selectedPlaylist!.name}`,
    });
    setSelectedPlaylist(null);

    const spotifyTracks = await getPlaylistTracks(
      selectedPlaylist!.id,
      spotify,
    );

    const tracks = spotifyTracks.map((track) => ({
      durationMs: track.duration_ms,
      trackId: track.id,
    }));

    await mutateAsync(tracks);
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
        <Button
          title="Let's kick it"
          inverted
          onPress={start}
          disabled={isLoading}
        />
      </Popover>
    </SafeAreaView>
  );
};

export default FromPlaylist;
