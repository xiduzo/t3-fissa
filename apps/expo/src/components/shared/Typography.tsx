import { FC } from "react";
import { Animated, TextProps } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

export const Typography: FC<Props> = ({
  children,
  className,
  variant,
  centered,
  inverted,
  dimmed,
  animatedColor,
  ...props
}) => {
  return (
    <Animated.Text
      {...props}
      className={typography({ variant, centered, dimmed, className })}
      style={[
        { color: animatedColor ?? theme[!!inverted ? "900" : "100"] },
        props.style,
      ]}
    >
      {children}
    </Animated.Text>
  );
};

interface Props extends TextProps, VariantProps<typeof typography> {
  animatedColor?: Animated.AnimatedInterpolation<string | number>;
}

const typography = cva("", {
  variants: {
    variant: {
      h1: "font-bold text-3xl",
      h2: "font-bold text-2xl",
      h3: "font-bold text-xl",
      h4: "font-semibold text-lg",
      h5: "font-medium text-2xl",
      h6: "font-medium text-lg",
      bodyL: "font-normal text-base",
      bodyM: "font-normal text-sm",
    },
    centered: {
      true: "text-center",
    },
    inverted: {
      true: " ",
      false: " ",
    },
    dimmed: {
      true: "opacity-60",
      false: "",
    },
  },
  defaultVariants: {
    variant: "bodyL",
    inverted: false,
  },
});
