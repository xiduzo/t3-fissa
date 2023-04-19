import { useEffect } from "react";
import { AppState } from "react-native";

export const useOnActiveApp = (callback: Function) => {
  useEffect(() => {
    const { remove } = AppState.addEventListener("change", async () => {
      if (AppState.currentState !== "active") return;
      await callback();
    });

    return remove;
  }, [callback]);
};
