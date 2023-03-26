import { FC, useEffect, useRef } from "react";
import {
  Animated,
  ImageStyle,
  StyleProp,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  View,
  ViewProps,
} from "react-native";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Image } from "./Image";
import { Typography } from "./Typography";

export const ListItem: FC<Props> = ({
  imageUri,
  title,
  subtitle,
  subtitlePrefix,
  extra,
  end,
  inverted,
  hasBorder,
  selected,
  bigImage,
  className,
  ...props
}) => {
  const selectedAnimation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animate = (config: Partial<Animated.SpringAnimationConfig> = {}) => {
      Animated.spring(selectedAnimation, {
        toValue: 0,
        bounciness: 0,
        useNativeDriver: false,
        ...config,
      }).start();
    };

    animate(selected ? { toValue: 1, bounciness: 12 } : {});
  }, [selected]);

  const opacity = selectedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });

  const backgroundColor = selectedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [theme["900"] + "00", theme["900"] + "80"],
  });

  const scale = selectedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <TouchableWithoutFeedback accessibilityRole="button" {...props}>
      <View
        {...props}
        className={container({ hasBorder, className })}
        style={[
          { borderColor: hasBorder ? theme["900"] + "10" : "transparent" },
          props.style,
        ]}
      >
        <View className="mr-4">
          <Image
            className={image({ bigImage })}
            hasBorder={hasBorder}
            source={imageUri}
          />
          <Animated.View
            className="absolute h-20 w-20 items-center justify-center rounded-xl"
            style={{ backgroundColor }}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Typography className="text-2xl">✅</Typography>
            </Animated.View>
          </Animated.View>
        </View>
        <Animated.View className="flex-shrink flex-grow" style={{ opacity }}>
          <Typography
            numberOfLines={2}
            variant="h4"
            inverted={inverted}
            className="mb-1"
          >
            {title}
          </Typography>
          <View className="flex-row">
            {subtitlePrefix}
            {subtitle && (
              <Typography
                inverted={inverted}
                numberOfLines={1}
                dimmed
                className="flex-grow"
                variant="bodyM"
              >
                {subtitle}
              </Typography>
            )}
          </View>
          {extra && <View className="mt-2">{extra}</View>}
        </Animated.View>
        <Animated.View className="ml-1" style={{ opacity }}>
          {end}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};
export interface ListItemProps extends Props {}

interface Props extends TouchableWithoutFeedbackProps, ViewProps {
  imageUri?: string;
  title: string;
  subtitle: string | boolean;
  subtitlePrefix?: JSX.Element;
  extra?: JSX.Element;
  end?: JSX.Element;
  inverted?: boolean;
  hasBorder?: boolean;
  selected?: boolean;
  bigImage?: boolean;
}

const container = cva("items-center flex-row my-3 max-w-full", {
  variants: {
    hasBorder: {
      true: "border rounded-xl",
    },
    inverted: {
      true: "bg-white",
    },
  },
});

const image = cva("h-20 w-20", {
  variants: {
    bigImage: {
      true: "h-32 w-32",
    },
  },
});