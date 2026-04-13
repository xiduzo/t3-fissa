import { type FC } from "react";
import { View } from "react-native";

import { useTheme } from "../../providers";

export const Divider: FC<Props> = ({ inverted }) => {
  const theme = useTheme();
  return (
    <View
      className="my-4 h-[1] w-full"
      style={{ backgroundColor: theme[inverted ? "100" : "900"] + "10" }}
    />
  );
};

interface Props {
  inverted?: boolean;
}
