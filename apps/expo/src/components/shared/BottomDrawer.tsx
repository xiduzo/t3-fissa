import { type FC } from "react";
import { View, type GestureResponderEvent } from "react-native";
import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";

import { useTheme } from "../../providers";
import { IconButton } from "./button";
import { type IconName } from "./Icon";

export const BottomDrawer: FC<Props> = ({
  children,
  action,
  actionTitle,
  actionIcon = "close",
  style,
  ...rest
}) => {
  const theme = useTheme();
  return (
    <View className="absolute bottom-0 w-full shadow-xl" style={{ shadowColor: theme["900"] }}>
      <LinearGradient
        colors={theme.gradient as [string, string, ...string[]]}
        start={[0, 0]}
        end={[1, 1]}
        className="rounded-t-3xl px-3 pb-14 pt-5 md:px-6"
        style={style}
        {...rest}
      >
        <View className="p-4 flex-row items-center justify-end">
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
        <View className="m-auto w-full max-w-lg px-3 mb-12">{children}</View>
      </LinearGradient>
    </View>
  );
};

interface Props extends Omit<LinearGradientProps, "colors"> {
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: IconName;
  actionTitle?: string;
}
