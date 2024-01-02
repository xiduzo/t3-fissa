import { useCallback } from "react";
import { Share } from "react-native";
import { theme } from "@fissa/tailwind-config";

export const useShareFissa = (pin: string) => {
  const shareFissa = useCallback(async () => {
    return Share.share(
      {
        title: "Join the Fissa!",
        message: `You have been invited to join the Fissa! https://fissa-houseparty.vercel.app/fissa/${pin}`,
        url: `https://fissa-houseparty.vercel.app/fissa/${pin}`,
      },
      {
        dialogTitle: "Join the Fissa!",
        subject: `You have been invited to join the Fissa! https://fissa-houseparty.vercel.app/fissa/${pin}`,
        tintColor: theme["500"],
      },
    );
  }, [pin]);

  return { shareFissa };
};
