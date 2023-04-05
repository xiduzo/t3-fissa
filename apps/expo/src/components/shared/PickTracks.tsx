import { FC, useCallback, useMemo, useRef, useState } from "react";
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
import { Image } from "./Image";
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

  useMemo(async () => {
    if (!selectedPlaylist) {
      if (!debounced) return setTracks([]);
      const { tracks } = await spotify.search(debounced, ["track"]);
      setTracks(tracks?.items || []);
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

    await getPlaylistTracks(selectedPlaylist.id, spotify, (tracks) => {
      playlistTracks.current = tracks;
      setFilteredTracks(tracks);
    });
  }, [selectedPlaylist, spotify]);

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          animation: "fade_from_bottom",
          animationDuration: 100,
          headerLeft: () =>
            selectedPlaylist && <HeaderLeft onPress={clearSelectedPlaylist} />,
          headerRight: () => <HeaderRight onPress={back} />,
        }}
      />
      <View className="h-full w-full">
        <View className="px-6">
          <Input
            startIcon="search"
            ref={inputRef}
            editable={!!user}
            variant="contained"
            placeholder={`Search in ${selectedPlaylist?.name || "spotify"}`}
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
                  <>
                    <Typography variant="h1" className="m-6">
                      Your playlists
                    </Typography>
                    <PlaylistList
                      onPlaylistPress={setSelectedPlaylist}
                      playlistEnd={
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={theme["100"] + "80"}
                        />
                      }
                    />
                  </>
                )}
                {selectedPlaylist && (
                  <>
                    <View className="m-6">
                      <View className="h-40 w-40">
                        <Image
                          className="h-full w-full"
                          source={selectedPlaylist.images[0]?.url}
                        />
                      </View>
                      <Typography variant="h1" className="mt-6">
                        {selectedPlaylist.name}
                      </Typography>
                    </View>
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
                  </>
                )}
              </View>
            ) : (
              <EmptyState
                icon="🦭"
                title="Not connected to spotify"
                // subtitle="and show them what you've got"
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
  onPress: (event: GestureResponderEvent) => void;
}> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Typography>
        <Ionicons name="close" size={24} title="close" />
      </Typography>
    </TouchableOpacity>
  );
};

const HeaderLeft: FC<{
  onPress: (event: GestureResponderEvent) => void;
}> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Typography>
        <Ionicons name="arrow-back" size={24} title="back" />
      </Typography>
    </TouchableOpacity>
  );
};
