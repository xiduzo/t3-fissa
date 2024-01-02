import { useCallback, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { getPlaylistTracks, useSpotify } from "@fissa/utils";

import {
  Button,
  PageTemplate,
  PlaylistList,
  PlaylistListItem,
  Popover,
  Typography,
} from "../../src/components";
import { useCreateFissa } from "../../src/hooks";

const FromPlaylist = () => {
  const spotify = useSpotify();

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const { mutateAsync, isLoading } = useCreateFissa();

  const start = useCallback(async () => {
    if (!selectedPlaylist) return;
    const spotifyTracks = await getPlaylistTracks(selectedPlaylist.id, spotify);

    await mutateAsync(spotifyTracks);

    setSelectedPlaylist(null);
  }, [selectedPlaylist, mutateAsync, spotify]);

  return (
    <PageTemplate fullScreen>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <View className="h-full justify-between">
        <Typography
          variant="h1"
          className="px-6 pb-8 pt-4"
          accessibilityLabel="Select playlist to start fissa from"
        >
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
        {selectedPlaylist && (
          <PlaylistListItem
            playlist={selectedPlaylist}
            hasBorder
            inverted
            className="mb-8"
            accessibilityElementsHidden
          />
        )}
        <Button
          title="Let's kick it"
          inverted
          onPress={start}
          disabled={isLoading}
          // TODO: set accessibilityFocus when selectedPlaylist changes
          accessibilityLabel={`Start fissa based on ${selectedPlaylist?.name}`}
        />
      </Popover>
    </PageTemplate>
  );
};

export default FromPlaylist;
