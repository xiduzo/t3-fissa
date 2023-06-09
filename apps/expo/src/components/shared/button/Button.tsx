import { FC, useCallback, useMemo } from "react";
import {
  GestureResponderEvent,
  ButtonProps as NativeButtonProps,
  TouchableHighlight,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

import { Icon, IconName } from "../Icon";
import { Typography } from "../Typography";

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
      accessibilityLabel={title}
      {...props}
      onPress={handlePress}
      accessibilityRole="button"
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

interface Props extends NativeButtonProps, VariantProps<typeof button> {
  disabled?: boolean;
  className?: string;
  linkTo?: string;
  icon?: IconName;
}

export interface ButtonProps extends Props {}

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
