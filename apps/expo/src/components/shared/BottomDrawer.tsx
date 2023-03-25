import { FC } from "react";
import { GestureResponderEvent, View } from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

interface BottomDrawerProps extends Omit<LinearGradientProps, "colors"> {
  title?: JSX.Element | false;
  action?: (event: GestureResponderEvent) => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
}

export const BottomDrawer: FC<BottomDrawerProps> = ({
  title,
  action,
  children,
  actionIcon = "close",
}) => {
  return (
    <LinearGradient
      colors={theme.gradient}
      start={[0, 0]}
      end={[1, 1]}
      className="absolute bottom-0 w-full rounded-3xl px-3 pt-5  pb-16"
    >
      <View className={bottomDrawer({ hasTitle: !!title })}>
        {title}
        {action && <Ionicons name={actionIcon} size={24} onPress={action} />}
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
