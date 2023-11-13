import { type FC } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import { theme } from "@fissa/tailwind-config";

import { IconButton } from "./button";
import { Typography } from "./Typography";

export const Header: FC<NativeStackHeaderProps> = (props) => {
  const { back } = useRouter();
  const safeArea = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between space-x-2 px-6 pb-2 shadow-md"
      style={{
        backgroundColor: theme["900"],
        paddingTop: safeArea.top + 8,
        shadowColor: theme["900"],
      }}
    >
      {!!props.options.headerRight && !props.options.title && !props.options.headerLeft && (
        <View className="grow" />
      )}
      {props.back && props.options.headerBackVisible && (
        <IconButton
          icon="arrow-left"
          className="mr-2"
          title={props.options.headerBackTitle ?? "Go back"}
          onPress={back}
        />
      )}
      {props.options.headerLeft?.({ canGoBack: true })}
      {props.options.title && (
        <View className="grow">
          <Typography variant="h2">{props.options.title}</Typography>
        </View>
      )}
      {props.options.headerRight?.({ canGoBack: false })}
    </View>
  );
};
