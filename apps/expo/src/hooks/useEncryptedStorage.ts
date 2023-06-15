import { useCallback, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { logger } from "@fissa/utils";

interface State {
  items: Map<string, string>;
  setItem: (key: string, value: string | null) => void;
}

const useStore = create<State>((set) => ({
  items: new Map(),
  setItem: (key, value) => {
    if (!value) return;
    set((state) => {
      state.items.set(key, value);
      return state;
    });
  },
}));

export const useEncryptedStorage = (key: string) => {
  const { items, setItem } = useStore();

  const save = useCallback(async (value: string) => {
    await SecureStore.setItemAsync(key, value);
    setItem(key, value);
  }, []);

  const getValueFor = useCallback(async () => {
    return await SecureStore.getItemAsync(key);
  }, []);

  useEffect(() => {
    getValueFor()
      .then((value) => {
        setItem(key, value);
      })
      .catch(logger.error);
  }, [getValueFor, key]);

  return { value: items.get(key), save, getValueFor };
};

export const ENCRYPTED_STORAGE_KEYS = {
  refreshToken: "refreshToken",
  sessionToken: "sessionToken",
  scopes: "scopes",
};
