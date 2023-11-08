import { useEffect } from "react";
import { AppState } from "react-native";

export const useOnActiveApp = (callback: () => void) => {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", () => {
      if (AppState.currentState !== "active") return;
      callback();
    });

    return () => {
      subscription.remove();
    };
  }, [callback]);
};
