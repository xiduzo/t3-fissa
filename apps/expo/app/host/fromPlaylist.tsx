import { useCallback, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import {
  Button,
  PlaylistList,
  PlaylistListItem,
  Popover,
  Typography,
} from "../../src/components";
import {
  ENCRYPTED_STORAGE_KEYS,
  useCreateRoom,
  useEncryptedStorage,
} from "../../src/hooks";
import { useSpotify } from "../../src/providers";
import { toast } from "../../src/utils";

const FromPlaylist = () => {
  const { push } = useRouter();
  const spotify = useSpotify();

  const { save } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastRoomId);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const { mutateAsync } = useCreateRoom();

  const start = useCallback(async () => {
    // TODO: fetch all tracksIds if playlist has more than 50 tracks
    // TODO: from saved tracks
    const { items } = await spotify.getPlaylistTracks(selectedPlaylist!.id);

    const tracks = items.map(({ track }) => ({
      durationMs: track.duration_ms,
      trackId: track.id,
    }));

    await mutateAsync(tracks, {
      onSuccess: async ({ pin }) => {
        setSelectedPlaylist(null);
        await save(pin);
        push(`/room/${pin}`);
        toast.success({ message: "Enjoy your fissa", icon: "🎉" });
      },
      onError: (error) => {
        toast.error({ message: error.message });
      },
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
