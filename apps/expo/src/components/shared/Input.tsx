import { forwardRef } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { cva, type VariantProps } from "@fissa/utils";

import { Icon, type IconName } from "./Icon";

export const Input = forwardRef<TextInput, Props>(function Input(
  { variant, className, startIcon, ...props },
  ref,
) {
  return (
    <View
      className={view({ className })}
      style={{
        backgroundColor: variant === "contained" ? theme["100"] + "20" : "transparent",
      }}
    >
      {startIcon && (
        <Icon accessibilityElementsHidden name={startIcon} size={18} color={theme["100"] + "70"} />
      )}
      <TextInput
        ref={ref}
        {...props}
        className={input({ disabled: !props.editable })}
        clearButtonMode="always"
        blurOnSubmit
        placeholderTextColor={theme["100"] + "70"}
        style={{
          color: theme["100"],
        }}
      />
    </View>
  );
});

interface Props extends VariantProps<typeof input>, TextInputProps {
  startIcon?: IconName;
}

const view = cva("flex-row items-center space-x-2 rounded-md px-4 py-3");

const input = cva("flex-grow", {
  variants: {
    variant: {
      contained: "",
    },
    disabled: {
      true: "opacity-50",
    },
  },
});
