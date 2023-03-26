import { FC } from "react";
import { Button } from "react-native";
import { useSearchParams } from "expo-router";

import { useAuth } from "../../../providers";
import { api } from "../../../utils";
import { EmptyState } from "../../shared";

export const ListEmptyComponent: FC<Props> = ({ isLoading }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const { data: room } = api.room.byId.useQuery(pin!);

  const isPlaying = (room?.currentIndex ?? -1) >= 0;
  const isOwner = user?.id === room?.userId;

  if (isLoading)
    return <EmptyState icon="🐕" title="Fetching tracks" subtitle="Good boy" />;

  if (!isPlaying)
    return (
      <EmptyState
        icon="🦥"
        title="This fissa is asleep"
        subtitle={!isOwner && "Poke your host to continue"}
      >
        {isOwner && <Button title="Continue fissa" />}
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
