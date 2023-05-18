import { FC, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { theme } from "@fissa/tailwind-config";

import { Typography } from "./Typography";

export const Badge: FC<Props> = ({ amount, inverted }) => {
  const amountRef = useRef(amount);
  const amountAnimation = useRef(new Animated.Value(0)).current;

  const scale = amountAnimation.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1.2, 1],
  });

  const backgroundColor = amountAnimation.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [
      inverted ? theme["900"] + "65" : theme["100"] + "70",
      theme[inverted ? "900" : "500"],
      theme[inverted ? "900" : "500"],
      inverted ? theme["900"] + "60" : theme["100"] + "70",
    ],
  });

  const color = amountAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [theme[inverted ? "100" : "900"], theme[inverted ? "100" : "900"]],
  });

  useEffect(() => {
    if (amountRef.current === amount) return;
    const animation = Animated.spring(amountAnimation, {
      toValue: Number(amount !== 0),
      velocity: 0.1,
      useNativeDriver: false,
    });

    animation.start(() => {
      animation.reset();
      amountRef.current = amount;
    });
  }, [amount]);

  if (amount === undefined) return null;

  return (
    <Animated.View
      className="my-0.5 justify-center rounded-sm px-1"
      style={{ backgroundColor, transform: [{ scale }] }}
    >
      <Typography
        centered
        className="text-xs font-extrabold"
        animatedColor={color}
        style={{ minWidth: 16 + (amount > 10 ? 6 : 0) }}
      >
        {amount > 0 && "+"}
        {amount}
      </Typography>
    </Animated.View>
  );
};

interface Props {
  amount?: number;
  inverted?: boolean;
}
