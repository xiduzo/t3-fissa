import { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { VariantProps, cva } from "@fissa/utils";

export const Input = forwardRef<TextInput, Props>(
  ({ variant, className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        {...props}
        className={input({ variant, className })}
        clearButtonMode="always"
        blurOnSubmit
        style={{
          backgroundColor:
            variant === "contained" ? theme["100"] : "transparent",
        }}
      />
    );
  },
);

interface Props extends VariantProps<typeof input>, TextInputProps {}

const input = cva("p-4 rounded-md", {
  variants: {
    variant: {
      contained: "",
    },
  },
});
