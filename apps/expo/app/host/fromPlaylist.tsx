import { useCallback, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";

import {
  Button,
  PageTemplate,
  PlaylistList,
  PlaylistListItem,
  Popover,
  Typography,
} from "../../src/components";
import { useCreateFissa, usePlaylistTracks } from "../../src/hooks";

const FromPlaylist = () => {
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const { data: playlistTracks = [] } = usePlaylistTracks(selectedPlaylist?.id ?? null);

  const { mutateAsync, isPending } = useCreateFissa();

  const start = useCallback(async () => {
    if (!selectedPlaylist || !playlistTracks.length) return;
    await mutateAsync(playlistTracks);
    setSelectedPlaylist(null);
  }, [selectedPlaylist, playlistTracks, mutateAsync]);

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
          disabled={isPending}
          // TODO: set accessibilityFocus when selectedPlaylist changes
          accessibilityLabel={`Start fissa based on ${selectedPlaylist?.name}`}
        />
      </Popover>
    </PageTemplate>
  );
};

export default FromPlaylist;
