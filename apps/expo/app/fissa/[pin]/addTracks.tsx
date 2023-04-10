import { useRouter, useSearchParams } from "expo-router";

import { PickTracks } from "../../../src/components/shared";
import { useAddTracks } from "../../../src/hooks";
import { toast } from "../../../src/utils";

const AddTracks = () => {
  const { pin } = useSearchParams();

  const { back } = useRouter();

  const { mutateAsync, isLoading } = useAddTracks(String(pin), {
    onError: () => {
      toast.error({ message: "Failed to add tracks" });
    },
    onMutate: ({ tracks }) => {
      toast.success({ message: `Added ${tracks.length} tracks` });
      back();
    },
  });

  return (
    <PickTracks
      onAddTracks={mutateAsync}
      disabledAction={isLoading || !pin}
      actionTitle="Add tracks"
    />
  );
};

export default AddTracks;
