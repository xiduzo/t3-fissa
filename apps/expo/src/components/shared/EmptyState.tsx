import { FC, PropsWithChildren } from "react";
import { View } from "react-native";

import { Typography } from "./Typography";

const EmptyState: FC<Props & PropsWithChildren> = ({
  icon,
  title,
  subtitle,
  children,
}) => {
  // minHeight: "75%",
  return (
    <View className="min-h-[75vh] flex-grow justify-center">
      <Typography
        style={{ textAlign: "center", fontSize: 90, lineHeight: 110 }}
        variant="h1"
      >
        {icon}
      </Typography>
      <Typography className="pt-4" centered variant="h2">
        {title}
      </Typography>
      {subtitle && (
        <Typography className="pt-4" centered>
          {subtitle}
        </Typography>
      )}
      {children && <View className="my-8">{children}</View>}
    </View>
  );
};

export default EmptyState;

interface Props {
  icon: string;
  title: string;
  subtitle?: boolean | string;
}
