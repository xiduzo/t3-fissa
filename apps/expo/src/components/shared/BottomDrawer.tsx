import { FC } from "react";
import { GestureResponderEvent, View } from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

import { IconName } from "./Icon";
import { IconButton } from "./button";

export const BottomDrawer: FC<Props> = ({
  children,
  action,
  actionTitle,
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

interface Props extends Omit<LinearGradientProps, "colors">, VariantProps<typeof bottomDrawer> {
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: IconName;
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
