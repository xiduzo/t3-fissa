import { FC, PropsWithChildren } from "react";
import { View } from "react-native";

import { Typography } from "./Typography";

export const EmptyState: FC<Props & PropsWithChildren> = ({ icon, title, subtitle, children }) => {
  return (
    <View className="justify-center flex-grow py-20">
      <Typography
        style={{ textAlign: "center", fontSize: 90, lineHeight: 110 }}
        variant="h1"
        accessibilityElementsHidden
      >
        {icon}
      </Typography>
      <Typography
        className="pt-4"
        centered
        variant="h2"
        accessibilityLabel={`${icon}: ${title}, ${subtitle}`}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography className="pt-4" centered accessibilityElementsHidden>
          {subtitle}
        </Typography>
      )}
      {children && <View className="my-8">{children}</View>}
    </View>
  );
};

interface Props {
  icon: string;
  title: string;
  subtitle?: boolean | string;
}
