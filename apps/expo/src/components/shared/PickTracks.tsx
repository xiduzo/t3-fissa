import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed, useDebounceValue, useSpotify } from "@fissa/utils";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import {
    View,
    type NativeSyntheticEvent,
    type TextInput,
    type TextInputChangeEventData,
} from "react-native";

import { type FlashListRef } from "@shopify/flash-list";
import { usePlaylistTracks } from "../../hooks";
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
  const ref = useRef<FlashListRef<SpotifyApi.TrackObjectFull>>(null);

  const [searchedTracks, setSearchedTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyApi.PlaylistObjectSimplified | null>(null);

  // TanStack Query handles caching + persistence via SQLite
  const { data: playlistTracks = [] } = usePlaylistTracks(selectedPlaylist?.id ?? null);

  const filteredTracks = useMemo(() => {
    if (!selectedPlaylist) return [];
    if (!debounced) return playlistTracks;
    const q = debounced.toLowerCase();
    return playlistTracks.filter((track) => {
      if (track.name?.toLowerCase().includes(q)) return true;
      if (track.artists.some((a) => a.name?.toLowerCase().includes(q))) return true;
      if (track.album.name?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [selectedPlaylist, debounced, playlistTracks]);

  const clearSelectedPlaylist = useCallback(() => {
    setSelectedPlaylist(null);
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

  // Spotify search (only when no playlist is selected)
  useEffect(() => {
    if (selectedPlaylist) return;
    if (!debounced) return setSearchedTracks([]);
    void spotify.search(debounced, ["track"]).then(({ tracks }) => {
      setSearchedTracks(tracks?.items ?? []);
    });
  }, [debounced, selectedPlaylist, spotify]);

  useEffect(() => {
    ref.current?.scrollToIndex({ index: 0, animated: true });
  }, [searchedTracks]);

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
                <View className="shrink grow">
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
