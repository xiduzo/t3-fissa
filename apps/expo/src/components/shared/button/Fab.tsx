import { useCallback, useEffect, useRef, type FC } from "react";
import { Animated, TouchableHighlight, type GestureResponderEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { AnimationSpeed } from "@fissa/utils";

import { Icon } from "../Icon";
import { type IconButtonProps } from "./IconButton";

export const Fab: FC<Props> = ({ icon, ...props }) => {
  const { onPress, linkTo } = props;
  const shownAnimation = useRef(new Animated.Value(0)).current;

  const { push } = useRouter();

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      onPress?.(event);

      if (linkTo) push(linkTo);
    },
    [push, onPress, linkTo],
  );

  useEffect(() => {
    Animated.spring(shownAnimation, {
      toValue: 1,
      delay: AnimationSpeed.Slow,
      useNativeDriver: false,
    }).start();
  }, [shownAnimation]);

  return (
    <TouchableHighlight
      accessibilityLabel={props.title}
      accessibilityRole="button"
      {...props}
      className="absolute bottom-6 right-6 z-50 flex h-14 w-14 rounded-2xl shadow-xl md:bottom-16"
      onPress={handlePress}
    >
      <Animated.View style={{ transform: [{ scale: shownAnimation }] }}>
        <LinearGradient
          colors={theme.gradient}
          start={[0, 0]}
          end={[1, 1]}
          className="h-full w-full items-center justify-center rounded-2xl"
        >
          <Icon name={icon} />
        </LinearGradient>
      </Animated.View>
    </TouchableHighlight>
  );
};

type Props = IconButtonProps;
