import { FC, useCallback, useMemo } from "react";
import {
  ButtonProps,
  GestureResponderEvent,
  TouchableHighlight,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VariantProps, cva } from "@fissa/utils";

import { Typography } from "./Typography";

export const Button: FC<Props> = ({
  title,
  inverted,
  variant,
  endIcon,
  ...props
}) => {
  const { push } = useRouter();

  const textInverted = useMemo(() => {
    if (inverted) {
    }

    return !variant || variant === "contained";
  }, [inverted, variant]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      props.onPress?.(event);

      if (props.linkTo) push(props.linkTo);
    },
    [props.onPress, props.linkTo, push],
  );

  return (
    <TouchableHighlight
      {...props}
      disabled={props.disabled}
      onPress={handlePress}
    >
      <View
        className={button({ inverted, disabled: !!props.disabled, variant })}
      >
        {/* {start && <View style={styles.start}>{start}</View>} */}
        <Typography
          className="flex-grow font-bold"
          centered
          inverted={textInverted}
        >
          {title.toLowerCase()}
        </Typography>
        {endIcon && (
          <Typography className="ml-2 mt-0.5" centered>
            <Ionicons name={endIcon} size={16} />
          </Typography>
        )}
      </View>
    </TouchableHighlight>
  );
};

interface Props extends ButtonProps, VariantProps<typeof button> {
  disabled?: boolean;
  className?: string;
  linkTo?: string;
  endIcon?: keyof typeof Ionicons.glyphMap;
}

const button = cva(
  "flex flex-row items-center border-2 rounded-lg border-theme-500",
  {
    variants: {
      variant: {
        outlined: "py-5",
        contained: "bg-theme-500 py-5",
        text: "bg-transparent border-transparent",
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
  },
);
