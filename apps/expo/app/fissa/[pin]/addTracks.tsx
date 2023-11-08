import { useGlobalSearchParams, useRouter } from "expo-router";
import { useAddTracks } from "@fissa/hooks";

import { PickTracks } from "../../../src/components/shared";
import { toast } from "../../../src/utils";

const AddTracks = () => {
  const { pin } = useGlobalSearchParams();

  const { back } = useRouter();

  const { mutateAsync, isLoading } = useAddTracks(String(pin), {
    onError: () => {
      toast.error({ message: "Failed to add songs" });
    },
    onMutate: ({ tracks }) => {
      toast.success({ message: `Added ${tracks.length} songs` });
      back();
    },
  });

  return (
    <PickTracks
      onAddTracks={mutateAsync}
      disabledAction={isLoading || !pin}
      actionTitle="Add songs"
    />
  );
};

export default AddTracks;
