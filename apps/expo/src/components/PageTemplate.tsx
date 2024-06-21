import { theme } from "@fissa/tailwind-config";
import { cva, type VariantProps } from "@fissa/utils";
import { type FC } from "react";
import { SafeAreaView, View, type ViewProps } from "react-native";

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

interface Props extends ViewProps, VariantProps<typeof pageTemplate> { }

const pageTemplate = cva("m-auto h-full w-full justify-between", {
  variants: {
    /**
     * Fullscreen means `max-w-screen-2xl` (1536px)
     */
    fullScreen: {
      true: "max-w-screen-2xl",
      false: "p-6 pb-8 max-w-lg",
    },
  },
  defaultVariants: {
    fullScreen: false,
  },
});
