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

  const size = 56;

  return (
    <TouchableHighlight
      accessibilityLabel={props.title}
      accessibilityRole="button"
      {...props}
      style={{ position: "absolute", bottom: 24, right: 24, zIndex: 50, width: size, height: size, borderRadius: size / 2 }}
      onPress={handlePress}
    >
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, transform: [{ scale: shownAnimation }] }}>
        <LinearGradient
          colors={theme.gradient as [string, string, ...string[]]}
          start={[0, 0]}
          end={[1, 1]}
          style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name={icon} />
        </LinearGradient>
      </Animated.View>
    </TouchableHighlight>
  );
};

type Props = IconButtonProps;
