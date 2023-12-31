import { type FC } from "react";
import { SafeAreaView, View, type ViewProps } from "react-native";
import { theme } from "@fissa/tailwind-config";
import { cva, type VariantProps } from "@fissa/utils";

export const PageTemplate: FC<Props> = ({ children, className, ...props }) => {
  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <View {...props} className={pageTemplate({ className })}>
        {children}
      </View>
    </SafeAreaView>
  );
};

interface Props extends ViewProps, VariantProps<typeof pageTemplate> {}

const pageTemplate = cva("m-auto h-full w-full max-w-lg justify-between p-6 pb-4");
