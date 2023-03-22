import { FC } from "react";
import { ButtonProps, TouchableHighlight, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Typography } from "./Typography";

interface ActionProps extends Omit<ButtonProps, "color"> {
  icon: keyof typeof Ionicons.glyphMap;
  subtitle?: boolean | string;
  active?: boolean;
  inverted?: boolean;
  reversed?: boolean;
  hidden?: boolean;
  layout?: "row" | "column";
}

const Action: FC<ActionProps> = ({
  icon,
  title,
  subtitle,
  active,
  inverted,
  reversed,
  hidden,
  layout = "row",
  ...props
}) => {
  if (hidden) return null;

  return (
    <TouchableHighlight {...props} underlayColor="transparent" className="py-4">
      <View className={content({ layout, reversed })}>
        <View
          className={iconStyle({
            layout,
            disabled: props.disabled,
          })}
          style={{
            borderColor: theme[!!inverted ? "900" : "100"],
            backgroundColor: active ? theme["900"] : "transparent",
          }}
        >
          <Typography inverted={!active && inverted}>
            <Ionicons name={icon} size={24} />
          </Typography>
        </View>
        <View className={text({ disabled: props.disabled, layout })}>
          <Typography
            variant="h4"
            inverted={inverted}
            centered={layout === "column"}
            className="mb-1"
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              centered={layout === "column"}
              variant="bodyM"
              className="opacity-60"
              inverted={inverted}
            >
              {subtitle}
            </Typography>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default Action;

const text = cva("mx-4", {
  variants: {
    disabled: {
      true: "opacity-30",
    },
    layout: {
      row: "",
      column: "py-9",
    },
  },
});

const iconStyle = cva("rounded-xl border-2 p-2", {
  variants: {
    layout: {
      row: "flex-row",
      column: "flex-col",
    },
    disabled: {
      true: "opacity-30",
    },
  },
});

const content = cva("items-center", {
  variants: {
    layout: {
      row: "flex-row",
      column: "flex-col",
    },
    reversed: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      layout: "column",
      reversed: true,
      className: "flex-col-reverse",
    },
  ],
});
