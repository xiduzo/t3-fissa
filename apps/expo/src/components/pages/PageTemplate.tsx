import { type FC } from "react";
import { SafeAreaView, View, type ViewProps } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { cva, type VariantProps } from "@fissa/utils";

export const PageTemplate: FC<Props> = ({ children, className, fullScreen, ...props }) => {
  const Wrapper = fullScreen ? View : SafeAreaView;

  return (
    <Wrapper style={{ backgroundColor: theme["900"] }}>
      <View {...props} className={pageTemplate({ className, fullScreen })}>
        {children}
      </View>
    </Wrapper>
  );
};

interface Props extends ViewProps, VariantProps<typeof pageTemplate> {}

const pageTemplate = cva("m-auto h-full w-full max-w-lg justify-between", {
  variants: {
    fullScreen: {
      true: "",
      false: "p-6 pb-4",
    },
  },
  defaultVariants: {
    fullScreen: false,
  },
});
