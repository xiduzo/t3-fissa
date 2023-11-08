import { type FC } from "react";
import { View } from "react-native";

import { Typography } from "../../shared";

export const ListFooterComponent: FC<{ tracksShown: boolean }> = ({ tracksShown }) => {
  if (!tracksShown) return null;

  return (
    <View className="mb-36 items-center justify-center py-24">
      <Typography variant="h1" className="mb-4">
        🦦
      </Typography>
      <Typography variant="bodyM">Add songs or I&apos;ll fill the queue</Typography>
    </View>
  );
};
