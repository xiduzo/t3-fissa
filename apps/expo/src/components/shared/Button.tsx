import { FC, useCallback, useMemo } from "react";
import {
  ButtonProps,
  GestureResponderEvent,
  TouchableHighlight,
  TouchableOpacityBase,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

import { Typography } from "./Typography";

export const Button: FC<Props> = ({
  title,
  inverted,
  variant,
  icon,
  ...props
}) => {
  const { push } = useRouter();

  const textInverted = useMemo(() => {
    if (inverted) {
      return variant && variant !== "contained";
    }

    return !variant || variant === "contained";
  }, [inverted, variant]);

  const backgroundColor = useMemo(() => {
    if (!variant || variant === "contained") {
      return theme[!!inverted ? "900" : "500"];
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
      className={`rounded-lg ${props.className}`}
    >
      <View
        className={button({
          inverted,
          disabled: !!props.disabled,
          variant,
        })}
        style={{
          borderColor: theme[!!inverted ? "900" : "500"],
          backgroundColor,
        }}
      >
        <Typography
          className="flex-grow font-bold"
          centered
          inverted={textInverted}
        >
          {title}
        </Typography>
        {icon && (
          <Typography className="ml-2 mt-0.5" centered>
            <Ionicons name={icon} size={16} />
          </Typography>
        )}
      </View>
    </TouchableHighlight>
  );
};

export const Fab: FC<Props> = ({ icon, ...props }) => {
  const { push } = useRouter();

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      props.onPress?.(event);

      if (props.linkTo) push(props.linkTo);
    },
    [props.onPress, props.linkTo],
  );

  return (
    <TouchableHighlight
      className="absolute bottom-10 right-8 z-40 flex h-14 w-14 rounded-2xl bg-black shadow-xl"
      {...props}
      onPress={handlePress}
    >
      <LinearGradient
        colors={theme.gradient}
        start={[0, 0]}
        end={[1, 1]}
        className="h-full w-full items-center justify-center rounded-2xl"
      >
        <Ionicons name={icon} size={32} />
      </LinearGradient>
    </TouchableHighlight>
  );
};

interface Props extends ButtonProps, VariantProps<typeof button> {
  disabled?: boolean;
  className?: string;
  linkTo?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const button = cva(`flex flex-row items-center border-2 rounded-lg`, {
  variants: {
    variant: {
      outlined: "py-5",
      contained: "py-5",
      text: "border-transparent",
    },
    inverted: {
      true: "",
      false: "",
    },
    disabled: {
      true: "opacity-50",
    },
  },
  defaultVariants: {
    variant: "contained",
    inverted: false,
  },
  compoundVariants: [],
});
