import { FC, useCallback, useEffect, useRef } from "react";
import { Animated, GestureResponderEvent, TouchableHighlight } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

import { Icon } from "../Icon";
import { IconButtonProps } from "./IconButton";

export const Fab: FC<Props> = ({ icon, position, ...props }) => {
  const shownAnimation = useRef(new Animated.Value(0)).current;

  const { push } = useRouter();

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      props.onPress?.(event);

      if (props.linkTo) push(props.linkTo);
    },
    [props.onPress, props.linkTo],
  );

  useEffect(() => {
    Animated.spring(shownAnimation, {
      toValue: 1,
      delay: 2500,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <TouchableHighlight
      accessibilityLabel={props.title}
      accessibilityRole="button"
      {...props}
      className="absolute bottom-10 right-8 z-50 flex h-14 w-14 rounded-2xl shadow-xl md:bottom-16"
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

interface Props extends IconButtonProps, VariantProps<typeof fab> {}

const fab = cva("absolute bottom-10 z-50 flex h-14 w-14 md:bottom-16 rounded-2xl shadow-xl", {
  variants: {
    position: {
      "bottom-left": "left-8",
      "bottom-right": "right-8",
      "bottom-center": "left-1/2 transform -translate-x-7",
    },
  },
  defaultVariants: {
    position: "bottom-right",
  },
});
