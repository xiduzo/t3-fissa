import { FC, useMemo } from "react";
import { TouchableHighlight } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { cva } from "@fissa/utils";

import { Icon, IconName } from "../Icon";
import { ButtonProps } from "./Button";

export const IconButton: FC<Props> = ({ icon, inverted, dimmed, ...props }) => {
  const color = useMemo(() => {
    const baseColor = theme[inverted ? "900" : "100"];

    return dimmed ? baseColor + "60" : baseColor;
  }, [inverted, dimmed]);

  return (
    <TouchableHighlight
      {...props}
      accessibilityLabel={props.title}
      accessibilityRole="button"
      className={iconButton({ disabled: props.disabled, className: props.className })}
      underlayColor={theme[inverted ? "900" : "500"] + "30"}
    >
      <Icon name={icon} color={color} />
    </TouchableHighlight>
  );
};

interface Props extends ButtonProps {
  icon: IconName;
}

export interface IconButtonProps extends Props {}

const iconButton = cva("-m-2 rounded-full p-2", {
  variants: {
    disabled: {
      true: "opacity-40",
    },
  },
});
