import { type FC } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import { theme } from "@fissa/tailwind-config";

import { Typography } from "./Typography";
import { IconButton } from "./button";

export const Header: FC<NativeStackHeaderProps> = (props) => {
  const { back } = useRouter();
  const safeArea = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between px-6 pb-2 shadow-md"
      style={{
        backgroundColor: theme["900"],
        paddingTop: safeArea.top + 8,
        shadowColor: theme["900"],
      }}
    >
      <View>
        {props.back && props.options.headerBackVisible && (
          <IconButton
            icon="arrow-left"
            title={props.options.headerBackTitle ?? "Go back"}
            onPress={back}
          />
        )}
        {props.options.headerLeft?.({ canGoBack: true })}
      </View>
      <View className="flex-grow">
        {props.options.title && <Typography variant="h2">{props.options.title}</Typography>}
      </View>
      <View>{props.options.headerRight?.({ canGoBack: false })}</View>
    </View>
  );
};
