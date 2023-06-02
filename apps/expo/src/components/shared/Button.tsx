import { FC, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ButtonProps,
  GestureResponderEvent,
  TouchableHighlight,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

import { Icon, IconName } from "./Icon";
import { Typography } from "./Typography";

export const Button: FC<Props> = ({ title, inverted, variant, icon, dimmed, ...props }) => {
  const { push } = useRouter();

  const textInverted = useMemo(() => {
    if (inverted) {
      return variant && variant !== "contained";
    }

    return !variant || variant === "contained";
  }, [inverted, variant]);

  const backgroundColor = useMemo(() => {
    if (!variant || variant === "contained") {
      return theme[inverted ? "900" : "500"];
    }

    return "transparent";
  }, [inverted, variant]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      props.onPress?.(event);

      if (props.linkTo) push(props.linkTo);
    },
    [props.onPress, props.linkTo],
  );

  return (
    <TouchableHighlight
      {...props}
      disabled={props.disabled}
      onPress={handlePress}
      className={`rounded-full ${props.className}`}
      underlayColor={theme[inverted ? "900" : "500"] + "10"}
    >
      <View
        className={button({
          inverted,
          disabled: !!props.disabled,
          variant,
          dimmed,
        })}
        style={{
          borderColor: theme[inverted ? "900" : "500"],
          backgroundColor,
        }}
      >
        {icon && (
          <Typography inverted={textInverted} variant="h3" className="w-6 text-center">
            <Icon name={icon} />
          </Typography>
        )}
        <Typography
          className="font-bold"
          centered
          inverted={textInverted}
          variant="h3"
          style={variant === "outlined" && { color: theme["500"] }}
        >
          {title}
        </Typography>
      </View>
    </TouchableHighlight>
  );
};

export const Fab: FC<FabProps> = ({ icon, position, ...props }) => {
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
      {...props}
      className={fab({ position, className: props.className })}
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

export const IconButton: FC<PropsWithIcon> = ({ icon, inverted, dimmed, ...props }) => {
  const color = useMemo(() => {
    const baseColor = theme[inverted ? "900" : "100"];

    return dimmed ? baseColor + "60" : baseColor;
  }, [inverted, dimmed]);

  return (
    <TouchableHighlight
      {...props}
      className={`-m-2 rounded-full p-2 ${props.className}`}
      underlayColor={theme[inverted ? "900" : "500"] + "30"}
    >
      <Icon name={icon} color={color} />
    </TouchableHighlight>
  );
};

interface FabProps extends PropsWithIcon, VariantProps<typeof fab> {}

interface PropsWithIcon extends Props {
  icon: IconName;
}

interface Props extends ButtonProps, VariantProps<typeof button> {
  disabled?: boolean;
  className?: string;
  linkTo?: string;
  icon?: IconName;
}

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

const button = cva(
  `flex flex-row items-center justify-center space-x-4 border-2 p-5 rounded-full`,
  {
    variants: {
      variant: {
        outlined: "",
        contained: "",
        text: "border-transparent",
      },
      inverted: {
        true: "",
        false: "",
      },
      disabled: {
        true: "opacity-40",
      },
      dimmed: {
        true: "opacity-60",
      },
    },
    defaultVariants: {
      variant: "contained",
      inverted: false,
    },
  },
);
