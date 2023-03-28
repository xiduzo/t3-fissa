import { useRouter } from "expo-router";

import {
  ENCRYPTED_STORAGE_KEYS,
  useCreateRoom as useBaseCreateRoom,
  useEncryptedStorage,
} from "../../../../hooks";
import { toast } from "../../../../utils";

export const useCreateRoom = () => {
  const { push } = useRouter();

  const { save } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastRoomId);

  return useBaseCreateRoom({
    onSuccess: async ({ pin }) => {
      toast.success({ message: "Enjoy your fissa", icon: "🎉" });
      await save(pin);
      push(`/room/${pin}`);
    },
    onError: (error) => {
      toast.error({ message: error.message });
    },
  });
};
