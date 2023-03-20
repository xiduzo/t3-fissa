import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

export const useEncryptedStorage = <T>(key: string) => {
  const [value, setValue] = useState<T>();

  const save = useCallback(async (value: string) => {
    await SecureStore.setItemAsync(key, value);
  }, []);

  const getValueFor = useCallback(async () => {
    let result = await SecureStore.getItemAsync(key);
    return result;
  }, []);

  useEffect(() => {
    getValueFor().then((value) => setValue(value as T));
  }, [getValueFor, key]);

  return { value, save, getValueFor };
};
