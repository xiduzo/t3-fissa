import { FC } from "react";
import { View, ViewProps } from "react-native";
import { VariantProps, cva } from "@fissa/utils";

export const PageTemplate: FC<Props> = ({ children, className, ...props }) => {
  return (
    <View {...props} className={pageTemplate({ className })}>
      {children}
    </View>
  );
};

interface Props extends ViewProps, VariantProps<typeof pageTemplate> {}

const pageTemplate = cva("m-auto h-full w-full max-w-lg justify-between px-6");
