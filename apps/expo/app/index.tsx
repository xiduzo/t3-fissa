import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed } from "@fissa/utils";
import { Stack, useRouter } from "expo-router";
import * as SystemUI from "expo-system-ui";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, View } from "react-native";

import { Button, Logo, Typography } from "../src/components";
import { useAuth } from "../src/providers";

const Index = () => {
  const { signIn, user, isLoading } = useAuth();
  const { replace } = useRouter();

  const colorAnimation = useRef(new Animated.Value(0)).current;
  const notSignedInAnimation = useRef(new Animated.Value(0)).current;
  const signedInAnimation = useRef(new Animated.Value(0)).current;

  const color = colorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF90", theme["100"]],
  });

  const backgroundColor = colorAnimation.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: ["#000", "#000", theme["900"], theme["900"]],
  });

  const position = notSignedInAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });

  const translateY = notSignedInAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 0],
  });

  const scale = signedInAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 20],
  });

  const logoTranslate = signedInAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const opacity = signedInAnimation.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 1, 0],
  });

  const colorAnimationCallback: Animated.EndCallback = useCallback(({finished})  => {
    if(!finished) return

    if (!user) {
       Animated.spring(notSignedInAnimation, {
        toValue: 1,
        useNativeDriver: false,
      }).start()
       return
    }

    Animated.timing(signedInAnimation, {
      toValue: 1,
      duration: AnimationSpeed.Fast,
      useNativeDriver: false,
    }).start(() => replace("/home"));
  }, [user, notSignedInAnimation, signedInAnimation, replace])

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme["900"]);
    Animated.timing(colorAnimation, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: false,
    }).start(colorAnimationCallback);
  }, [colorAnimation, colorAnimationCallback]);

  return (
    <Animated.View style={{ backgroundColor }} className="h-full items-center justify-between px-6">
      <Stack.Screen options={{ headerShown: false }} />
      <View />
      <Logo
        viewStyle={{
          marginTop: position,
          opacity: opacity,
          transform: [{ scale }, { translateY: logoTranslate }],
        }}
        progress={colorAnimation}
      />
      <View className="mx-auto w-full max-w-lg">
        <Animated.View
          className="mb-36 items-center"
          style={{
            opacity: notSignedInAnimation,
            transform: [{ translateY }],
          }}
        >
          <Typography
            variant="h1"
            centered
            className="mb-4"
            accessibilityLabel="A live shared playlist, curated together"
          >
            A live shared playlist
          </Typography>
          <Typography variant="h5" centered accessibilityElementsHidden>
            curated together
          </Typography>
        </Animated.View>
        <Animated.View
          className="mb-12"
          style={{
            opacity: notSignedInAnimation,
            transform: [{ scale: notSignedInAnimation }],
          }}
        >
          <Button
            icon="spotify"
            onPress={signIn}
            title="Connect to get started"
            disabled={!!user || isLoading}
            accessibilityLabel="Connect to spotify to get started"
          />
        </Animated.View>
        <Typography
          centered
          className="mb-8 italic"
          dimmed
          variant="bodyM"
          animatedColor={color}
          accessibilityLabel="Fissa is made by Milanovski and Xiduzo"
        >
          by Milanovski and Xiduzo
        </Typography>
      </View>
    </Animated.View>
  );
};

export default Index;
