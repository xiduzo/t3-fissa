import { useCallback, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { getPlaylistTracks, useSpotify } from "@fissa/utils";

import { Button, PlaylistList, PlaylistListItem, Popover, Typography } from "../../src/components";
import { useCreateFissa } from "../../src/hooks";

const FromPlaylist = () => {
  const spotify = useSpotify();

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const { mutateAsync, isLoading } = useCreateFissa();

  const start = useCallback(async () => {
    const spotifyTracks = await getPlaylistTracks(selectedPlaylist!.id, spotify);

    await mutateAsync(spotifyTracks);

    setSelectedPlaylist(null);
  }, [selectedPlaylist]);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View className="justify-between h-full">
        <Typography variant="h1" className="px-6 pt-4 pb-8">
          Select playlist
        </Typography>
        <PlaylistList
          onPlaylistPress={setSelectedPlaylist}
          ListFooterComponent={<View className="pb-28" />}
        />
      </View>
      <Popover visible={!!selectedPlaylist} onRequestClose={() => setSelectedPlaylist(null)}>
        <Typography variant="h2" centered inverted className="mb-8" accessibilityElementsHidden>
          Your fissa will start based on
        </Typography>
        <PlaylistListItem
          playlist={selectedPlaylist!}
          hasBorder
          inverted
          className="mb-8"
          accessibilityElementsHidden
        />
        <Button
          title="Let's kick it"
          inverted
          onPress={start}
          disabled={isLoading}
          accessibilityLabel={`Start fissa based on ${selectedPlaylist?.name}`}
        />
      </Popover>
    </SafeAreaView>
  );
};

export default FromPlaylist;
