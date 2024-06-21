import { theme } from "@fissa/tailwind-config";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import { useRouter } from "expo-router";
import { useEffect, useRef, type FC } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimationSpeed } from "@fissa/utils";
import { Typography } from "./Typography";
import { IconButton } from "./button";

export const Header: FC<NativeStackHeaderProps> = (props) => {
  const backButtonAnimation = useRef(new Animated.Value(0)).current;

  const { back } = useRouter();
  const safeArea = useSafeAreaInsets();


  const opacity = backButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });

  useEffect(() => {
    Animated.timing(backButtonAnimation, {
      toValue: 1,
      duration: AnimationSpeed.Fast,
      useNativeDriver: true,
      delay: 300,
    }).start();
  }, [backButtonAnimation])

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
        <Animated.View style={{ opacity }}>
          <IconButton
            icon="arrow-left"
            className="mr-2"
            title={props.options.headerBackTitle ?? "Go back"}
            onPress={back}
          />
        </Animated.View>
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
