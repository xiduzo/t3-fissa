import { FC } from "react";
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Typography } from "./Typography";

interface BottomDrawerProps extends Omit<LinearGradientProps, "colors"> {
  title?: JSX.Element | false;
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
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
      className="absolute bottom-0 w-full rounded-3xl px-3 pt-5 pb-10"
    >
      <View className={bottomDrawer({ hasTitle: !!title })}>
        {title}
        {action && (
          <TouchableOpacity
            disabled={actionDisabled}
            className={actionStyle({ disabled: actionDisabled })}
            onPress={action}
          >
            {actionTitle && <Typography inverted>{actionTitle}</Typography>}
            <Ionicons name={actionIcon} size={24} />
          </TouchableOpacity>
        )}
      </View>
      <View className="px-3">{children}</View>
    </LinearGradient>
  );
};

const bottomDrawer = cva("flex-row items-center mb-4", {
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
