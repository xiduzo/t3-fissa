import { FC } from "react";
import { useSearchParams } from "expo-router";

import { useGetFissa, useRestartFissa } from "../../../hooks";
import { useAuth } from "../../../providers";
import { toast } from "../../../utils";
import { Button, EmptyState } from "../../shared";

export const ListEmptyComponent: FC<Props> = ({ isLoading }) => {
  const { pin } = useSearchParams();
  const { user } = useAuth();

  const { data: fissa } = useGetFissa(String(pin));
  const { mutateAsync } = useRestartFissa(String(pin), {
    onMutate: () => {
      toast.info({
        message: "Restarting fissa",
      });
    },
    onSuccess: () => {
      toast.success({
        icon: "🎉",
        message: "Let's go!",
      });
    },
  });

  if (isLoading)
    return <EmptyState icon="🐕" title="Fetching tracks" subtitle="Good boy" />;

  if (!fissa?.currentlyPlayingId) {
    const isOwner = user?.email === fissa?.by.email;
    return (
      <EmptyState
        icon="🦥"
        title="This fissa is asleep"
        subtitle={!isOwner && "Poke your host to continue"}
      >
        {isOwner && <Button onPress={mutateAsync} title="Continue fissa" />}
      </EmptyState>
    );
  }

  return (
    <EmptyState
      icon="🦀"
      title="No tracks found"
      subtitle="Add tracks to get the fissa started"
    />
  );
};

interface Props {
  isLoading: boolean;
}
