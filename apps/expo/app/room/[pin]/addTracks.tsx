import { FC, useCallback, useEffect, useRef, useState } from "react";
import {
  GestureResponderEvent,
  NativeSyntheticEvent,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter, useSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { useDebounce } from "@fissa/utils";

import {
  BottomDrawer,
  Button,
  EmptyState,
  Input,
  PlaylistList,
  TrackList,
  Typography,
} from "../../../src/components";
import { useAddTracks } from "../../../src/hooks";
import { useAuth } from "../../../src/providers";
import { toast } from "../../../src/utils";

type TrackList = SpotifyApi.TrackObjectFull[];
const AddTracks = () => {
  const { pin } = useSearchParams();
  const { promptAsync, user, spotify } = useAuth();

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

  const [tracks, setTracks] = useState<TrackList>([]);
  const playlistTracks = useRef<TrackList>([]);
  const [filteredTracks, setFilteredTracks] = useState<TrackList>([]);

  const [selectedTracks, setSelectedTracks] = useState<TrackList>([]);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const clearSelectedPlaylist = useCallback(() => {
    setSelectedPlaylist(null);
    playlistTracks.current = [];
    setSearch("");
  }, []);

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
    back();
    toast.info({ message: `Adding ${selectedTracks.length} tracks` });
    await mutateAsync(selectedTracks);
  }, [selectedTracks, back]);

  const handleSearch = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      const { text } = event.nativeEvent;
      setSearch(text);
    },
    [],
  );

  useEffect(() => {
    if (!selectedPlaylist) {
      if (!debounced) return setTracks([]);
      spotify.search(debounced, ["track"]).then((response) => {
        setTracks(response.tracks?.items || []);
      });
      return;
    }

    if (!debounced) return setFilteredTracks(playlistTracks.current);
    setFilteredTracks(
      playlistTracks.current.filter((track) => {
        const nameMatch = track.name
          .toLowerCase()
          .includes(debounced.toLowerCase());
        if (nameMatch) return nameMatch;

        const artistMatch = track.artists.some((artist) =>
          artist.name.toLowerCase().includes(debounced.toLowerCase()),
        );
        if (artistMatch) return artistMatch;

        const albumMatch = track.album.name
          .toLowerCase()
          .includes(debounced.toLowerCase());
        if (albumMatch) return albumMatch;
      }),
    );
  }, [debounced, selectedPlaylist, spotify, playlistTracks]);

  useEffect(() => {
    // TODO fetch all tracks
    if (!selectedPlaylist) return;

    spotify.getPlaylistTracks(selectedPlaylist.id).then((response) => {
      const items = response.items.map(
        (item) => item.track as SpotifyApi.TrackObjectFull,
      );
      playlistTracks.current = items;
      setFilteredTracks(items);
    });
  }, [selectedPlaylist, spotify]);

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          animation: "fade_from_bottom",
          animationDuration: 100,
          headerRight: () => (
            <HeaderRight
              selectedPlaylist={!!selectedPlaylist}
              onPress={selectedPlaylist ? clearSelectedPlaylist : back}
            />
          ),
        }}
      />
      <View className="h-full w-full">
        <View className="px-6">
          <Input
            ref={inputRef}
            variant="contained"
            placeholder={`Search ${selectedPlaylist?.name || "spotify"}`}
            value={search}
            onChange={handleSearch}
          />
        </View>

        <TrackList
          tracks={tracks}
          selectedTracks={selectedTracks.map((track) => track.id)}
          onTrackPress={handleTrackPress}
          ListFooterComponent={<View className="pb-96" />}
          ListEmptyComponent={
            user ? (
              <View className="-mx-6">
                {!selectedPlaylist && (
                  <PlaylistList onPlaylistPress={setSelectedPlaylist} />
                )}
                {selectedPlaylist && (
                  <TrackList
                    tracks={filteredTracks}
                    onTrackPress={handleTrackPress}
                    selectedTracks={selectedTracks.map((track) => track.id)}
                    ListFooterComponent={<View className="pb-40" />}
                  />
                )}
              </View>
            ) : (
              <EmptyState
                icon="🦭"
                title="Not connected to spotify"
                subtitle="and show them what you've got"
              >
                <Button title="Sign in" onPress={() => promptAsync()} />
              </EmptyState>
            )
          }
        />

        <BottomDrawer
          action={() => setSelectedTracks([])}
          actionDisabled={!selectedTracks.length}
          actionTitle="clear all"
          actionIcon="trash"
        >
          <Button
            title={`Add ${selectedTracks.length} tracks`}
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

const HeaderRight: FC<{
  selectedPlaylist?: boolean;
  onPress: (event: GestureResponderEvent) => void;
}> = ({ selectedPlaylist, onPress }) => {
  return (
    <TouchableOpacity
      className="flex flex-row items-center space-x-2"
      onPress={onPress}
    >
      {selectedPlaylist && (
        <Typography>
          <Ionicons name="arrow-back" size={24} title="close" />
        </Typography>
      )}
      {selectedPlaylist && <Typography>Search spotify</Typography>}
      {!selectedPlaylist && (
        <Typography>
          <Ionicons name="close" size={24} title="close" />
        </Typography>
      )}
    </TouchableOpacity>
  );
};
