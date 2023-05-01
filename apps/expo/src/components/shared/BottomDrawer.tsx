import { FC } from "react";
import { GestureResponderEvent, TouchableOpacity, View } from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Typography } from "./Typography";

interface BottomDrawerProps extends Omit<LinearGradientProps, "colors"> {
  title?: JSX.Element | false;
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: keyof typeof FontAwesome.glyphMap;
  actionDisabled?: boolean;
  actionTitle?: string;
}

export const BottomDrawer: FC<BottomDrawerProps> = ({
  title,
  children,
  action,
  actionTitle,
  actionDisabled,
  actionIcon = "close",
}) => {
  return (
    <LinearGradient
      colors={theme.gradient}
      start={[0, 0]}
      end={[1, 1]}
      className="absolute bottom-0 w-full rounded-3xl px-3 pb-10 pt-5 md:px-6"
    >
      <View className={titleStyle({ hasTitle: !!title })}>
        {title}
        {action && (
          <TouchableOpacity
            disabled={actionDisabled}
            className={actionStyle({ disabled: actionDisabled })}
            onPress={action}
          >
            {actionTitle && <Typography inverted>{actionTitle}</Typography>}
            <FontAwesome name={actionIcon} size={24} />
          </TouchableOpacity>
        )}
      </View>
      <View className="m-auto w-full max-w-lg px-3">{children}</View>
    </LinearGradient>
  );
};

const titleStyle = cva("flex-row items-center mb-4", {
  variants: {
    hasTitle: {
      true: "justify-between",
      false: "justify-end",
    },
  },
});

const actionStyle = cva("flex-row items-center space-x-1", {
  variants: {
    disabled: {
      true: "opacity-50",
      false: "",
    },
  },
});
