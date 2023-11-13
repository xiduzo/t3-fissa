import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { SAVED_TRACKS_PLAYLIST_ID, useSpotify, useTracks } from "@fissa/utils";

import { PlaylistList, TrackListItem } from "../../../../src/components";
import { toast } from "../../../../src/utils";

const AddToPlaylist = () => {
  const { trackId } = useGlobalSearchParams();
  const { back } = useRouter();
  const spotify = useSpotify();
  const tracks = useTracks([String(trackId)]);

  const track = useMemo(() => {
    return tracks?.find(({ id }) => id === trackId);
  }, [trackId, tracks]);

  const handlePlaylistPress = useCallback(
    async (playlist: SpotifyApi.PlaylistObjectSimplified) => {
      if (!track) return;
      if (playlist.id === SAVED_TRACKS_PLAYLIST_ID) {
        await spotify.addToMySavedTracks([track.id]);
      } else {
        await spotify.addTracksToPlaylist(playlist.id, [track.id]);
      }
      toast.success({
        icon: "🐘",
        message: `${track.name} saved to ${playlist.name}`,
      });
      back();
    },
    [track, spotify, back],
  );

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: true,
          title: `Save to spotify`,
          // headerRight: () => <HeaderRight />,
        }}
      />
      <PlaylistList
        onlyUserPlaylists
        onPlaylistPress={handlePlaylistPress}
        ListHeaderComponent={
          <View className="mb-8 mt-2 px-6">
            {track && <TrackListItem track={track} bigImage />}
          </View>
        }
        ListFooterComponent={<View className="pb-12" />}
      />
    </View>
  );
};

export default AddToPlaylist;
