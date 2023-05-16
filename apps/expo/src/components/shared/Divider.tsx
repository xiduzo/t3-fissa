import { View } from "react-native";
import { theme } from "@fissa/tailwind-config";

export const Divider = () => {
  return <View className="my-4 h-[1] w-full" style={{ backgroundColor: theme["900"] + "10" }} />;
};
