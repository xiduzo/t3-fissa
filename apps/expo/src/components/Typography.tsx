import { FC } from "react";
import { Animated, TextProps } from "react-native";
import { VariantProps, cva } from "@fissa/utils";

export const Typography: FC<Props> = ({
  children,
  className,
  variant,
  centered,
  inverted,
  ...props
}) => {
  return (
    <Animated.Text
      {...props}
      className={typography({ variant, centered, inverted, className })}
    >
      {children}
    </Animated.Text>
  );
};

interface Props extends TextProps, VariantProps<typeof typography> {}

const typography = cva("", {
  variants: {
    variant: {
      h1: "font-bold text-3xl",
      h2: "font-bold text-2xl",
      h3: "font-bold text-xl",
      h4: "font-semibold text-lg ",
      h5: "font-medium text-2xl",
      h6: "font-medium text-lg",
      bodyL: "font-normal text-base",
      bodyM: "font-normal text-sm",
    },
    inverted: {
      true: "text-theme-900",
      false: "text-theme-100",
    },
    centered: {
      true: "text-center",
    },
  },
  defaultVariants: {
    variant: "bodyL",
    inverted: false,
  },
});
