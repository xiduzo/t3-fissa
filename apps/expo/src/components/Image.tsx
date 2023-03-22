import { FC } from "react";
import { View } from "react-native";
import { Image as ExpoImage, ImageProps } from "expo-image";
import { theme } from "@fissa/tailwind-config";

console.log(theme["100"]);
export const Image: FC<ImageProps> = ({ ...props }) => {
  return (
    <View style={{ backgroundColor: "#FFFED9" }} className="rounded-xl">
      <ExpoImage contentFit="cover" {...props} />
    </View>
  );
};
