import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  NativeSyntheticEvent,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { getPlaylistTracks, useDebounce } from "@fissa/utils";

import { useAuth } from "../../providers";
import { BottomDrawer } from "./BottomDrawer";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Input } from "./Input";
import { PlaylistList } from "./PlaylistList";
import { TrackList } from "./TrackList";
import { Typography } from "./Typography";

export const PickTracks: FC<Props> = ({
  disabledAction,
  actionTitle,
  onAddTracks,
}) => {
  const { back } = useRouter();
  const { promptAsync, user, spotify } = useAuth();

  const inputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const playlistTracks = useRef<TrackList>([]);

  const [tracks, setTracks] = useState<TrackList>([]);
  const [selectedTracks, setSelectedTracks] = useState<TrackList>([]);
  const [filteredTracks, setFilteredTracks] = useState<TrackList>([]);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  const clearSelectedPlaylist = useCallback(() => {
    setSelectedPlaylist(null);
    playlistTracks.current = [];
    setSearch("");
  }, []);

  const handleAddTracks = useCallback(async () => {
    await onAddTracks(selectedTracks);
  }, [selectedTracks, onAddTracks]);

  const handleSearch = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      const { text } = event.nativeEvent;
      setSearch(text);
    },
    [],
  );

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

  useMemo(async () => {
    if (!selectedPlaylist) return;

    const tracks = await getPlaylistTracks(selectedPlaylist.id, spotify);

    playlistTracks.current = tracks;
    setFilteredTracks(tracks);
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
                    ListEmptyComponent={
                      <EmptyState
                        icon="🐕"
                        title="Fetching tracks"
                        subtitle="good boy"
                      />
                    }
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
          <Typography variant="h6" inverted centered className="mb-4">
            {selectedTracks.length} tracks selected
          </Typography>
          <Button
            title={actionTitle}
            inverted
            disabled={!selectedTracks.length || disabledAction}
            onPress={handleAddTracks}
          />
        </BottomDrawer>
      </View>
    </View>
  );
};

interface Props {
  disabledAction?: boolean;
  actionTitle: string;
  onAddTracks: (tracks: TrackList) => Promise<void>;
}

type TrackList = SpotifyApi.TrackObjectFull[];

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
