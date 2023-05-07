import { FC, useCallback, useMemo } from "react";
import {
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

export const Button: FC<Props> = ({
  title,
  inverted,
  variant,
  icon,
  dimmed,
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
          <Typography
            inverted={textInverted}
            variant="h3"
            className="w-6 text-center"
          >
            <Icon name={icon} size={28} />
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

export const Fab: FC<PropsWithIcon> = ({ icon, ...props }) => {
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
      className="absolute bottom-10 right-8 z-40 flex h-14 w-14 rounded-2xl shadow-xl"
      {...props}
      onPress={handlePress}
    >
      <LinearGradient
        colors={theme.gradient}
        start={[0, 0]}
        end={[1, 1]}
        className="h-full w-full items-center justify-center rounded-2xl"
      >
        <Icon name={icon} size={28} />
      </LinearGradient>
    </TouchableHighlight>
  );
};

export const IconButton: FC<PropsWithIcon> = ({ icon, inverted, ...props }) => {
  return (
    <TouchableHighlight {...props}>
      <Icon name={icon} size={28} color={theme[inverted ? "900" : "100"]} />
    </TouchableHighlight>
  );
};

interface PropsWithIcon extends Props {
  icon: IconName;
}

interface Props extends ButtonProps, VariantProps<typeof button> {
  disabled?: boolean;
  className?: string;
  linkTo?: string;
  icon?: IconName;
}

const button = cva(
  `flex flex-row items-center justify-center space-x-4 border-2 py-5 rounded-full`,
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
