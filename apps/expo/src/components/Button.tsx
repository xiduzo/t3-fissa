import { FC, useCallback, useMemo } from "react";
import {
  ButtonProps,
  GestureResponderEvent,
  TouchableHighlight,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { VariantProps, cva } from "@fissa/utils";

import { Typography } from "./Typography";

export const Button: FC<Props> = ({ title, inverted, variant, ...props }) => {
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
        <Typography className="text-center font-bold" inverted={textInverted}>
          {title.toLowerCase()}
        </Typography>
        {/* {end && <View style={styles.end}>{end}</View>} */}
      </View>
    </TouchableHighlight>
  );
};

interface Props extends ButtonProps, VariantProps<typeof button> {
  disabled?: boolean;
  className?: string;
  linkTo?: string;
}

const button = cva("border-2 text-center py-5 rounded-lg border-theme-500", {
  variants: {
    variant: {
      outlined: "",
      contained: "bg-theme-500",
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
});
