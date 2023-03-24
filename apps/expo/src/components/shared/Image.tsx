import { FC } from "react";
import { View } from "react-native";
import { Image as ExpoImage, ImageProps } from "expo-image";
import { theme } from "@fissa/tailwind-config";

export const Image: FC<ImageProps> = ({ ...props }) => {
  return (
    <View
      style={{ backgroundColor: theme["100"] }}
      className={`overflow-hidden rounded-xl ${props.className}`}
    >
      <ExpoImage contentFit="cover" {...props} />
    </View>
  );
};
