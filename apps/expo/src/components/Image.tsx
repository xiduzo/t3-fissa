import { FC } from "react";
import { Image as ExpoImage, ImageProps } from "expo-image";

export const Image: FC<ImageProps> = ({ ...props }) => {
  return (
    <ExpoImage
      className="bg-theme-100 rounded-xl"
      contentFit="cover"
      {...props}
    />
  );
};
