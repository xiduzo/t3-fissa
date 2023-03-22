import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, TextInput, View } from "react-native";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { useDebounce } from "@fissa/utils";

import {
  BottomDrawer,
  Button,
  TrackList,
  Typography,
} from "../../../src/components";
import { useSpotify } from "../../../src/providers";
import { api, toast } from "../../../src/utils";

const AddTracks = () => {
  const { pin } = useSearchParams();

  const { back } = useRouter();
  const spotify = useSpotify();

  const queryClient = api.useContext();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const [tracks, setTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<
    SpotifyApi.TrackObjectFull[]
  >([]);

  const { mutateAsync } = api.track.addTracks.useMutation();

  useEffect(() => {
    if (!debounced) return setTracks([]);

    // TODO: cache already fetched tracks
    // TODO: split into multiple requests if more than 50 tracks
    spotify.search(debounced, ["track"]).then((response) => {
      setTracks(response.tracks?.items || []);
    });
  }, [debounced]);

  const handleTrackPress = useCallback((track: SpotifyApi.TrackObjectFull) => {
    setSelectedTracks((prev) => {
      const mappedPrev = prev.map((track) => track.id);
      if (mappedPrev.includes(track.id)) {
        return prev.filter((prevTrack) => prevTrack.id !== track.id);
      }

      return [...prev, track];
    });
  }, []);

  const addTracks = useCallback(async () => {
    // TODO: move to custom hook
    await mutateAsync(
      {
        roomId: pin!,
        tracks: selectedTracks.map((track) => ({
          durationMs: track.duration_ms,
          trackId: track.id,
        })),
      },
      {
        onSuccess: async () => {
          toast.success({ message: "Tracks added to queue" });
          await queryClient.track.byRoomId.invalidate();
          back();
        },
      },
    );
  }, [selectedTracks, pin, queryClient]);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          animation: "fade_from_bottom",
          animationDuration: 100,
          headerRight: () => (
            <Typography>
              <Ionicons name="close" size={24} title="close" onPress={back} />
            </Typography>
          ),
        }}
      />
      <View className="mt-6 flex h-full w-full">
        <TextInput
          placeholder="search spotify"
          value={search}
          onChange={(e) => setSearch(e.nativeEvent.text)}
        />

        <TrackList
          tracks={tracks}
          selectedTracks={selectedTracks.map((track) => track.id)}
          onTrackPress={handleTrackPress}
        />

        <BottomDrawer>
          <Typography centered inverted className="mb-4">
            {selectedTracks.length} tracks selected
          </Typography>
          <Button
            title="Add to queue"
            inverted
            disabled={!pin || !selectedTracks.length}
            onPress={addTracks}
          />
        </BottomDrawer>
      </View>
    </SafeAreaView>
  );
};

export default AddTracks;
