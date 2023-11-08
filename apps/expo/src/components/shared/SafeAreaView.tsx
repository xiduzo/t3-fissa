import { type FC, type PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const SafeAreaView: FC<Props> = ({ children, noBottom, noTop, ...props }) => {
  const safeArea = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        {
          paddingTop: noTop ? 0 : safeArea.top,
          paddingBottom: noBottom ? 0 : safeArea.bottom,
        },
        props.style,
      ]}
    >
      {children}
    </View>
  );
};

interface Props extends ViewProps, PropsWithChildren {
  noBottom?: boolean;
  noTop?: boolean;
}
