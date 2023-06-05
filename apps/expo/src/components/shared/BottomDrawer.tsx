import { FC } from "react";
import { GestureResponderEvent, TouchableOpacity, View } from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

import { Icon, IconName } from "./Icon";
import { Typography } from "./Typography";

export const BottomDrawer: FC<Props> = ({
  title,
  children,
  action,
  actionTitle,
  actionDisabled,
  className,
  size,
  actionIcon = "close",
}) => {
  return (
    <View className={bottomDrawer({ size, className })} style={{ shadowColor: theme["900"] }}>
      <LinearGradient
        colors={theme.gradient}
        start={[0, 0]}
        end={[1, 1]}
        className={linearGradient({ size })}
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
              {actionIcon && <Icon name={actionIcon} />}
            </TouchableOpacity>
          )}
        </View>
        <View className="m-auto w-full max-w-lg px-3">{children}</View>
      </LinearGradient>
    </View>
  );
};

interface Props extends Omit<LinearGradientProps, "colors">, VariantProps<typeof bottomDrawer> {
  title?: JSX.Element | false;
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: IconName | null;
  actionDisabled?: boolean;
  actionTitle?: string;
}

const bottomDrawer = cva("absolute shadow-xl", {
  variants: {
    size: {
      full: "bottom-0 w-full",
      partial: "bottom-10  md:bottom-16 w-full flex items-center",
    },
  },
  defaultVariants: {
    size: "full",
  },
});

const linearGradient = cva("md:px-6", {
  variants: {
    size: {
      full: "rounded-3xl pb-10 pt-5 px-3",
      partial: "rounded-2xl pb-4 px-2",
    },
  },
  defaultVariants: {
    size: "full",
  },
});

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
