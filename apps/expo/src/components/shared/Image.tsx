import { type FC } from "react";
import { View } from "react-native";
import { Image as ExpoImage, type ImageProps } from "expo-image";
import { theme } from "@fissa/tailwind-config";
import { cva, type VariantProps } from "@fissa/utils";

export const Image: FC<Props> = ({ className, hasBorder, ...props }) => {
  return (
    <View
      style={{ backgroundColor: theme["100"] }}
      className={image({ hasBorder: !!hasBorder, className })}
    >
      <ExpoImage contentFit="cover" {...props} />
    </View>
  );
};

interface Props extends ImageProps, VariantProps<typeof image> {}

const image = cva("overflow-hidden", {
  variants: {
    hasBorder: {
      true: "rounded-l-xl",
      false: "rounded-xl",
    },
  },
});
