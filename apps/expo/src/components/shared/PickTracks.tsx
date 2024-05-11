import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed, getPlaylistTracks, useDebounceValue, useSpotify } from "@fissa/utils";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import {
    View,
    type NativeSyntheticEvent,
    type TextInput,
    type TextInputChangeEventData,
} from "react-native";

import { type FlashList } from "@shopify/flash-list";
import { PageTemplate } from "../PageTemplate";
import { BottomDrawer } from "./BottomDrawer";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { PlaylistList } from "./PlaylistList";
import { PlaylistListItem } from "./PlaylistListItem";
import { TrackList } from "./TrackList";
import { Typography } from "./Typography";
import { Button, ButtonGroup, IconButton } from "./button";

export const PickTracks: FC<Props> = ({ disabledAction, actionTitle, onAddTracks }) => {
  const { back } = useRouter();
  const spotify = useSpotify();

  const inputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const [debounced] = useDebounceValue(search, 150);
  const ref = useRef<FlashList<SpotifyApi.TrackObjectFull>>(null);

  const playlistTracks = useRef<SpotifyApi.TrackObjectFull[]>([]);

  const [searchedTracks, setSearchedTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);

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

  useEffect(() => {
    if (!selectedPlaylist) {
      if (!debounced) return setSearchedTracks([]);
      void spotify.search(debounced, ["track"]).then(({ tracks }) => {
        setSearchedTracks(tracks?.items ?? []);
      });
      return;
    }

    if (!debounced) return setFilteredTracks(playlistTracks.current);
    setFilteredTracks(
      playlistTracks.current.filter((track) => {
        const nameMatch = track.name?.toLowerCase().includes(debounced?.toLowerCase());
        if (nameMatch) return nameMatch;

        const artistMatch = track.artists.some((artist) =>
          artist.name?.toLowerCase().includes(debounced?.toLowerCase()),
        );
        if (artistMatch) return artistMatch;

        const albumMatch = track.album.name?.toLowerCase().includes(debounced?.toLowerCase());
        if (albumMatch) return albumMatch;
      }),
    );
  }, [debounced, selectedPlaylist, spotify, playlistTracks]);

  useEffect(() => {
    if (!selectedPlaylist) return;

    void getPlaylistTracks(selectedPlaylist.id, spotify, (newTracks) => {
      playlistTracks.current = newTracks;
      setFilteredTracks([...newTracks]);
    });
  }, [selectedPlaylist, spotify]);

  useEffect(() => {
    ref.current?.scrollToIndex({ index: 0, animated: true });
  }, [searchedTracks])

  return (
    <>
      <PageTemplate fullScreen>
        <Stack.Screen
          options={{
            animation: "fade_from_bottom",
            animationDuration: AnimationSpeed.VeryFast,
            headerLeft: () => (
              <>
                {selectedPlaylist && (
                  <IconButton
                    className="mr-2"
                    icon="arrow-left"
                    title="back to playlists"
                    onPress={clearSelectedPlaylist}
                  />
                )}
                <View className="grow">
                  <Input
                    startIcon="search"
                    ref={inputRef}
                    variant="contained"
                    placeholder={`Search in ${selectedPlaylist?.name || "spotify"}`}
                    value={search}
                    onChange={handleSearch}
                  />
                </View>
              </>
            ),
            headerRight: () => <IconButton icon="close" title="back to fissa" onPress={back} />,
          }}
        />
        <View className="h-full w-full">
          <TrackList
            data={searchedTracks}
            ref={ref}
            selectedTracks={selectedTracks.map((track) => track.id)}
            onTrackPress={handleTrackPress}
            ListFooterComponent={<View className="pb-72" />}
            ListEmptyComponent={
              <View>
                {!selectedPlaylist && (
                  <>
                    <Typography variant="h1" className="m-6">
                      Your playlists
                    </Typography>
                    <PlaylistList
                      onPlaylistPress={setSelectedPlaylist}
                      playlistListItemEnd={
                        <Icon name="chevron-right" color={theme["100"] + "80"} />
                      }
                    />
                  </>
                )}
                {selectedPlaylist && (
                  <>
                    <View className="m-6">
                      <PlaylistListItem playlist={selectedPlaylist} bigImage />
                    </View>
                    <TrackList
                      data={filteredTracks}
                      onTrackPress={handleTrackPress}
                      selectedTracks={selectedTracks.map((track) => track.id)}
                      ListEmptyComponent={
                        <EmptyState icon="🐕" title="Fetching songs" subtitle="good boy" />
                      }
                    />
                  </>
                )}
              </View>
            }
          />
        </View>
      </PageTemplate>
      <BottomDrawer>
        <ButtonGroup>
          <Button
            title="Deselect all songs"
            variant="text"
            onPress={() => setSelectedTracks([])}
            inverted
            disabled={!selectedTracks.length}
          />
          <Button
            title={actionTitle}
            inverted
            disabled={!selectedTracks.length || disabledAction}
            onPress={handleAddTracks}
          />
        </ButtonGroup>
      </BottomDrawer>
    </>
  );
};

interface Props {
  disabledAction?: boolean;
  actionTitle: string;
  onAddTracks: (tracks: SpotifyApi.TrackObjectFull[]) => Promise<void>;
}
