import React, { useEffect, useMemo, useRef } from "react";
import { Animated, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { theme } from "@fissa/tailwind-config";

import { Button, Logo, Typography } from "../src/components";
import { useAuth } from "../src/providers";

const Index = () => {
  const { signIn, user } = useAuth();
  const { replace } = useRouter();

  const colorAnimation = useRef(new Animated.Value(0)).current;
  const notSignedInAnimation = useRef(new Animated.Value(0)).current;
  const signedInAnimation = useRef(new Animated.Value(0)).current;
  const animationsDone = useRef(false);
  const canSkipToHome = useRef(false);

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

  useEffect(() => {
    if (!user) return;
    canSkipToHome.current = true;
    if (!animationsDone.current) return;

    replace("/home");
  }, [user, replace]);

  useMemo(async () => {
    await SystemUI.setBackgroundColorAsync(theme["900"]);
  }, []);

  useEffect(() => {
    Animated.timing(colorAnimation, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      if (!canSkipToHome.current) {
        Animated.spring(notSignedInAnimation, {
          toValue: 1,
          useNativeDriver: false,
        }).start(() => {
          animationsDone.current = true;
        });
        return;
      }

      Animated.timing(signedInAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start(() => {
        replace("/home");
      });
    });
  }, [replace]);

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
          <Typography variant="h1" centered className="mb-4">
            A collaborative live playlist
          </Typography>
          <Typography variant="h5" centered>
            together with your friends
          </Typography>
        </Animated.View>
        <Animated.View
          className="mb-12"
          style={{
            opacity: notSignedInAnimation,
            transform: [{ scale: notSignedInAnimation }],
          }}
        >
          <Button icon="spotify" onPress={signIn} title="Connect to get started" />
        </Animated.View>
        <Typography centered className="mb-8" variant="bodyM" animatedColor={color}>
          Made by Milanovski and Xiduzo
        </Typography>
      </View>
    </Animated.View>
  );
};

export default Index;
