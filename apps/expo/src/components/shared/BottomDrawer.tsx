import { type FC } from "react";
import { View, type GestureResponderEvent } from "react-native";
import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";

import { IconButton } from "./button";
import { type IconName } from "./Icon";

export const BottomDrawer: FC<Props> = ({
  children,
  action,
  actionTitle,
  actionIcon = "close",
}) => {
  return (
    <View className="absolute bottom-0 w-full shadow-xl" style={{ shadowColor: theme["900"] }}>
      <LinearGradient
        colors={theme.gradient}
        start={[0, 0]}
        end={[1, 1]}
        className="rounded-3xl px-3 pb-10 pt-5 md:px-6"
      >
        <View className="mb-4 flex-row items-center justify-end">
          {action && (
            <IconButton
              icon={actionIcon}
              onPress={action}
              title={actionTitle ?? "close"}
              inverted
              className="mr-0.5"
            />
          )}
        </View>
        <View className="m-auto w-full max-w-lg px-3">{children}</View>
      </LinearGradient>
    </View>
  );
};

interface Props extends Omit<LinearGradientProps, "colors"> {
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: IconName;
  actionTitle?: string;
}
