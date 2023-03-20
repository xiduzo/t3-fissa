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

const BottomDrawer: FC<BottomDrawerProps> = ({
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
      className="rounded-3xl p-3 pb-10"
    >
      <View className={bottomDrawer({ hasTitle: !!title })}>
        {title}
        {action && <Ionicons name={actionIcon} size={24} onPress={action} />}
      </View>
      <View className="px-3">{children}</View>
    </LinearGradient>
  );
};

export default BottomDrawer;

const bottomDrawer = cva("flex-row items-center", {
  variants: {
    hasTitle: {
      true: "justify-between",
      false: "justify-end",
    },
  },
});
