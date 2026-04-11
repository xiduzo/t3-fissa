import { type FC, type PropsWithChildren } from "react";
import { View } from "react-native";

export const ButtonGroup: FC<PropsWithChildren> = ({ children }) => {
  return <View className="gap-6">{children}</View>;
};
