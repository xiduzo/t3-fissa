import { type FC, type PropsWithChildren } from "react";
import { View } from "react-native";

export const ButtonGroup: FC<PropsWithChildren> = ({ children }) => {
  return <View className="space-y-6">{children}</View>;
};
