import { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView, TextInput, View } from "react-native";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { SpotifyWebApi, useDebounce } from "@fissa/utils";

import {
  BottomDrawer,
  Button,
  Input,
  TrackList,
  Typography,
} from "../../../src/components";
import EmptyState from "../../../src/components/shared/EmptyState";
import { useAddTracks } from "../../../src/hooks";
import { useAuth } from "../../../src/providers";
import { toast } from "../../../src/utils";

const AddTracks = () => {
  const { pin } = useSearchParams();
  const { promptAsync, user } = useAuth();

  const { back } = useRouter();

  const inputRef = useRef<TextInput>(null);

  const { mutateAsync } = useAddTracks(String(pin), {
    onSuccess: () => {
      toast.success({ message: "Tracks added to queue" });
      back();
    },
    onError: () => {
      toast.error({ message: "Failed to add tracks" });
    },
  });

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const [tracks, setTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<
    SpotifyApi.TrackObjectFull[]
  >([]);

  useEffect(() => {
    if (!debounced) return setTracks([]);

    new SpotifyWebApi().search(debounced, ["track"]).then((response) => {
      setTracks(response.tracks?.items || []);
    });
  }, [debounced]);

  const handleTrackPress = useCallback((track: SpotifyApi.TrackObjectFull) => {
    inputRef.current?.blur();
    setSelectedTracks((prev) => {
      const mappedPrev = prev.map((track) => track.id);
      if (mappedPrev.includes(track.id)) {
        return prev.filter((prevTrack) => prevTrack.id !== track.id);
      }

      return [...prev, track];
    });
  }, []);

  const addTracks = useCallback(async () => {
    await mutateAsync(selectedTracks);
  }, [selectedTracks]);

  return (
    <View style={{ backgroundColor: theme["900"] }}>
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
      <View className="mt-4 h-full w-full">
        <View className="px-6">
          <Input
            ref={inputRef}
            variant="contained"
            placeholder="search spotify"
            value={search}
            onChange={(e) => setSearch(e.nativeEvent.text)}
          />
        </View>

        <TrackList
          tracks={tracks}
          selectedTracks={selectedTracks.map((track) => track.id)}
          onTrackPress={handleTrackPress}
          ListFooterComponent={<View className="pb-52" />}
          ListEmptyComponent={
            <EmptyState icon="🦭" title="No inspiration?">
              {user && (
                <Button title="browse your playlists" variant="outlined" />
              )}
              {!user && (
                <Button
                  title="Sign in to browse your playlists"
                  variant="outlined"
                  onPress={() => promptAsync()}
                />
              )}
            </EmptyState>
          }
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
    </View>
  );
};

export default AddTracks;