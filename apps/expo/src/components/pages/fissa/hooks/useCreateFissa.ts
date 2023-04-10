import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import {
  ENCRYPTED_STORAGE_KEYS,
  useCreateFissa as useBaseCreateFissa,
  useEncryptedStorage,
} from "../../../../hooks";
import { toast } from "../../../../utils";

export const useCreateFissa = () => {
  const { push } = useRouter();

  const { save } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastPin);

  return useBaseCreateFissa({
    onSuccess: async ({ pin }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success({ message: "Enjoy your fissa", icon: "🎉" });
      await save(pin);
      push(`/fissa/${pin}`);
    },
    onError: (error) => {
      toast.error({ message: error.message });
    },
  });
};
