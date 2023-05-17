import { FC } from "react";
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Icon, IconName } from "./Icon";
import { Typography } from "./Typography";

export const BottomDrawer: FC<Props> = ({
  title,
  children,
  action,
  actionTitle,
  actionDisabled,
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
        <View className={titleStyle({ hasTitle: !!title })}>
          {title}
          {action && (
            <TouchableOpacity
              disabled={actionDisabled}
              className={actionStyle({ disabled: actionDisabled })}
              onPress={action}
            >
              {actionTitle && (
                <Typography inverted variant="h4">
                  {actionTitle}
                </Typography>
              )}
              {actionIcon && <Icon name={actionIcon} size={24} />}
            </TouchableOpacity>
          )}
        </View>
        <View className="m-auto w-full max-w-lg px-3">{children}</View>
      </LinearGradient>
    </View>
  );
};

interface Props extends Omit<LinearGradientProps, "colors"> {
  title?: JSX.Element | false;
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: IconName | null;
  actionDisabled?: boolean;
  actionTitle?: string;
}

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
