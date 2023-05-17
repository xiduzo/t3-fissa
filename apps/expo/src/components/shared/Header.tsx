import { FC } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import { theme } from "@fissa/tailwind-config";

import { Icon } from "./Icon";
import { Typography } from "./Typography";

export const Header: FC<NativeStackHeaderProps> = (props) => {
  const { back } = useRouter();
  const safeArea = useSafeAreaInsets();

  return (
    <>
      <View
        className="flex flex-row items-center justify-between px-6 py-2 shadow-md"
        style={{
          backgroundColor: theme["900"],
          marginTop: safeArea.top,
          shadowColor: theme["900"],
        }}
      >
        <View>
          {props.back && props.options.headerBackVisible && (
            <Typography>
              <Icon name="arrow-left" size={28} onPress={back} />
            </Typography>
          )}
          {props.options.headerLeft && props.options.headerLeft({ canGoBack: true })}
        </View>
        <View className="flex-grow">
          {props.options.title && <Typography variant="h2">{props.options.title}</Typography>}
        </View>
        <View>{props.options.headerRight && props.options.headerRight({ canGoBack: false })}</View>
      </View>
    </>
  );
};
