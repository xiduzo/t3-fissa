import { type FC } from "react";
import { TouchableHighlight, View, type ButtonProps } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Icon, type IconName } from "./Icon";
import { Typography } from "./Typography";

export const Action: FC<Props> = ({
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
          className={iconStyle({ disabled: props.disabled })}
          style={{
            borderColor: theme[inverted ? "900" : "100"],
            backgroundColor: active ? theme["900"] : "transparent",
          }}
        >
          <Typography inverted={!active && inverted}>
            <Icon name={icon} />
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
            <Typography centered={layout === "column"} variant="bodyM" dimmed inverted={inverted}>
              {subtitle}
            </Typography>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
};

interface Props extends Omit<ButtonProps, "color"> {
  icon: IconName;
  subtitle?: boolean | string;
  active?: boolean;
  inverted?: boolean;
  reversed?: boolean;
  hidden?: boolean;
  layout?: "row" | "column";
}

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

const iconStyle = cva("rounded-xl border-2 w-12 h-12 justify-center items-center", {
  variants: {
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
    {
      layout: "row",
      reversed: true,
      className: "flex-row-reverse",
    },
  ],
});
