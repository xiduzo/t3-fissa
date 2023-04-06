import { View } from "react-native";
import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage, useGetRoomDetails, useGetTracks } from "../../hooks";
import { Button } from "./Button";
import { FC } from "react";
import { useTracks } from "@fissa/utils";

export const Rejoin = () => {
  const { value } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastPin);
  const { data } = useGetRoomDetails(value!);

  if (!value) return <View />; // no pin stored
  if (!data) return <View />; // no room found

  return (
    <View>
      <PrefetchTracks pin={value} />
      <Button
        variant="text"
        title={`Re-join last fissa (${value})`}
        linkTo={`/room/${value}`}
      />
    </View>
  );
};

const PrefetchTracks: FC<{ pin: string }> = ({ pin }) => {
  const { data } = useGetTracks(pin);

  // Pre-fetch tracks
  useTracks(data?.map((track) => track.trackId));

  return null;
};