import { useEffect, useState } from "react";
import { SafeAreaView, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
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

const AddTracks = () => {
  const { back } = useRouter();
  const spotify = useSpotify();

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const [tracks, setTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);

  useEffect(() => {
    if (!debounced) return setTracks([]);

    spotify.search(debounced, ["track"]).then((response) => {
      setTracks(response.tracks?.items || []);
    });
  }, [debounced]);

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

        <TrackList tracks={tracks} />

        <BottomDrawer>
          <Typography centered inverted className="mb-4">
            0 tracks selected
          </Typography>
          <Button title="Add to queue" inverted />
        </BottomDrawer>
      </View>
    </SafeAreaView>
  );
};

export default AddTracks;
