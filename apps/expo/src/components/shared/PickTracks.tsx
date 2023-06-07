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
import { useDebounce } from "@fissa/hooks";
import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed, getPlaylistTracks, useSpotify } from "@fissa/utils";

import { BottomDrawer } from "./BottomDrawer";
import { Button, IconButton } from "./Button";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";
import { Image } from "./Image";
import { Input } from "./Input";
import { PlaylistList } from "./PlaylistList";
import { TrackList } from "./TrackList";
import { Typography } from "./Typography";

export const PickTracks: FC<Props> = ({ disabledAction, actionTitle, onAddTracks }) => {
  const { back } = useRouter();
  const spotify = useSpotify();

  const inputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const playlistTracks = useRef<Tracks>([]);

  const [searchedTracks, setSearchedTracks] = useState<Tracks>([]);
  const [selectedTracks, setSelectedTracks] = useState<Tracks>([]);
  const [filteredTracks, setFilteredTracks] = useState<Tracks>([]);

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

  const handleSearch = useCallback((event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const { text } = event.nativeEvent;
    setSearch(text);
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

  useMemo(async () => {
    if (!selectedPlaylist) {
      if (!debounced) return setSearchedTracks([]);
      const { tracks } = await spotify.search(debounced, ["track"]);
      setSearchedTracks(tracks?.items || []);
      return;
    }

    if (!debounced) return setFilteredTracks(playlistTracks.current);
    setFilteredTracks(
      playlistTracks.current.filter((track) => {
        const nameMatch = track.name.toLowerCase().includes(debounced.toLowerCase());
        if (nameMatch) return nameMatch;

        const artistMatch = track.artists.some((artist) =>
          artist.name.toLowerCase().includes(debounced.toLowerCase()),
        );
        if (artistMatch) return artistMatch;

        const albumMatch = track.album.name.toLowerCase().includes(debounced.toLowerCase());
        if (albumMatch) return albumMatch;
      }),
    );
  }, [debounced, selectedPlaylist, spotify, playlistTracks]);

  useMemo(async () => {
    if (!selectedPlaylist) return;

    await getPlaylistTracks(selectedPlaylist.id, spotify, (newTracks) => {
      playlistTracks.current = newTracks;
      setFilteredTracks([...newTracks]);
    });
  }, [selectedPlaylist, spotify]);

  return (
    <View style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen
        options={{
          animation: "fade_from_bottom",
          animationDuration: AnimationSpeed.VeryFast,
          headerLeft: () =>
            selectedPlaylist && (
              <IconButton
                icon="arrow-left"
                title="back to playlists"
                onPress={clearSelectedPlaylist}
              />
            ),
          headerRight: () => <IconButton icon="close" title="back to fissa" onPress={back} />,
        }}
      />
      <View className="h-full w-full">
        <View className="my-4 px-6">
          <Input
            startIcon="search"
            ref={inputRef}
            variant="contained"
            placeholder={`Search in ${selectedPlaylist?.name || "spotify"}`}
            value={search}
            onChange={handleSearch}
          />
        </View>

        <TrackList
          data={searchedTracks}
          selectedTracks={selectedTracks.map((track) => track.id)}
          onTrackPress={handleTrackPress}
          ListFooterComponent={<View className="pb-96" />}
          ListEmptyComponent={
            <View>
              {!selectedPlaylist && (
                <>
                  <Typography variant="h1" className="m-6">
                    Your playlists
                  </Typography>
                  <PlaylistList
                    onPlaylistPress={setSelectedPlaylist}
                    playlistListItemEnd={<Icon name="chevron-right" color={theme["100"] + "80"} />}
                  />
                </>
              )}
              {selectedPlaylist && (
                <>
                  <View className="m-6">
                    <View className="h-40 w-40">
                      <Image className="h-full w-full" source={selectedPlaylist.images[0]?.url} />
                    </View>
                    <Typography variant="h1" className="mt-6">
                      {selectedPlaylist.name}
                    </Typography>
                  </View>
                  <TrackList
                    data={filteredTracks}
                    onTrackPress={handleTrackPress}
                    selectedTracks={selectedTracks.map((track) => track.id)}
                    ListFooterComponent={<View className="pb-40" />}
                    ListEmptyComponent={
                      <EmptyState icon="🐕" title="Fetching songs" subtitle="good boy" />
                    }
                  />
                </>
              )}
            </View>
          }
        />

        <BottomDrawer
          action={() => setSelectedTracks([])}
          actionDisabled={!selectedTracks.length}
          actionTitle="clear all"
          actionIcon={null}
        >
          <Typography variant="h6" inverted centered className="-mt-[38px] mb-4">
            {selectedTracks.length} songs selected
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
  onAddTracks: (tracks: Tracks) => Promise<void>;
}

type Tracks = SpotifyApi.TrackObjectFull[];
