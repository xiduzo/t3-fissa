import { FC } from "react";
import { View } from "react-native";
import { useGetFissaDetails, useGetTracks } from "@fissa/hooks";
import { RefetchInterval, useTracks } from "@fissa/utils";

import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from "../../hooks";
import { Button } from "./Button";

export const Rejoin = () => {
  const { value } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastPin);
  const { data } = useGetFissaDetails(value!, RefetchInterval.Lazy);

  if (!value) return <View />; // no pin stored
  if (!data) return <View />; // no fissa found

  return (
    <View>
      <PrefetchTracks pin={value} />
      <Button variant="text" title={`Re-join last fissa (${value})`} linkTo={`/fissa/${value}`} />
    </View>
  );
};

const PrefetchTracks: FC<{ pin: string }> = ({ pin }) => {
  const { data } = useGetTracks(pin);

  // Pre-fetch tracks
  useTracks(data?.map((track) => track.trackId));

  return null;
};
