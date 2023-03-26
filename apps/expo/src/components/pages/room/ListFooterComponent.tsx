import { View } from "react-native";

import { Typography } from "../../shared";

export const ListFooterComponent = () => {
  return (
    <View className="mb-36 flex items-center justify-center py-24">
      <Typography variant="h1" className="mb-4">
        🦦
      </Typography>
      <Typography variant="bodyM">Add tracks or I'll fill the queue</Typography>
    </View>
  );
};