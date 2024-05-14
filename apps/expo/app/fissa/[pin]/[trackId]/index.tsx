import { SAVED_TRACKS_PLAYLIST_ID, useSpotify, useTracks } from "@fissa/utils";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";

import { PageTemplate, PlaylistList, TrackListItem } from "../../../../src/components";
import { toast } from "../../../../src/utils";

const AddToPlaylist = () => {
  const { trackId } = useGlobalSearchParams();
  const { back } = useRouter();
  const spotify = useSpotify();
  const tracks = useTracks([String(trackId)]);

  const track = tracks?.find(({ id }) => id === trackId);

  const handlePlaylistPress = useCallback(
    async (playlist: SpotifyApi.PlaylistObjectSimplified) => {
      if (!track) return;
      if (playlist.id === SAVED_TRACKS_PLAYLIST_ID) {
        await spotify.addToMySavedTracks([track.id]);
      } else {
        await spotify.addTracksToPlaylist(playlist.id, [track.uri]);
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
    <PageTemplate>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: true,
          title: `Save to spotify`,
          animation: "slide_from_bottom",
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
    </PageTemplate>
  );
};

export default AddToPlaylist;
