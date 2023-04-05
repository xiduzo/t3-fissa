import { FC } from "react";
import { useSearchParams } from "expo-router";

import { useGetRoom, useRestartRoom } from "../../../hooks";
import { useAuth } from "../../../providers";
import { Button, EmptyState } from "../../shared";

export const ListEmptyComponent: FC<Props> = ({ isLoading }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const { data: room } = useGetRoom(pin!);
  const { mutateAsync } = useRestartRoom(pin!);

  const isPlaying = room?.currentIndex && room.currentIndex >= 0;
  const isOwner = user?.email === room?.by.email;

  if (isLoading)
    return <EmptyState icon="🐕" title="Fetching tracks" subtitle="Good boy" />;

  if (!isPlaying)
    return (
      <EmptyState
        icon="🦥"
        title="This fissa is asleep"
        subtitle={!isOwner && "Poke your host to continue"}
      >
        {isOwner && <Button onPress={mutateAsync} title="Continue fissa" />}
      </EmptyState>
    );

  return (
    <EmptyState
      icon="🦀"
      title="No tracks found"
      subtitle="Add tracks to get the party started"
    />
  );
};

interface Props {
  isLoading: boolean;
}
