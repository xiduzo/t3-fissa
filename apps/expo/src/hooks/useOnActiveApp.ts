import { useEffect } from "react";
import { AppState } from "react-native";

export const useOnActiveApp = (callback: Function) => {
  useEffect(() => {
    const { remove } = AppState.addEventListener("change", () => {
      if (AppState.currentState !== "active") return;
      callback();
    });

    return remove;
  }, [callback]);
};
