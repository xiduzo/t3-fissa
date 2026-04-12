import { useCallback } from "react";
import { Share } from "react-native";

import { useTheme } from "../providers";

export const useShareFissa = (pin: string) => {
  const theme = useTheme();

  const shareFissa = useCallback(async () => {
    return Share.share(
      {
        title: "Join the Fissa!",
        message: `You have been invited to join the Fissa! https://fissa.online/fissa/${pin}`,
        url: `https://fissa.online/fissa/${pin}`,
      },
      {
        dialogTitle: "Join the Fissa!",
        subject: `You have been invited to join the Fissa! https://fissa.online/fissa/${pin}`,
        tintColor: theme["500"],
      },
    );
  }, [pin, theme]);

  return { shareFissa };
};
