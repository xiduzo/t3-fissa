import { FC } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";
import { theme } from "@fissa/tailwind-config";

import { Typography } from "./Typography";

export const Header: FC<NativeStackHeaderProps> = (props) => {
  const { back } = useRouter();

  return (
    <View
      className="flex flex-row items-center justify-between px-6 pt-14 pb-4"
      style={{ backgroundColor: theme["900"] }}
    >
      <View>
        {props.back && props.options.headerBackVisible && (
          <Typography>
            <FontAwesome
              name="arrow-left"
              size={28}
              title="back"
              onPress={back}
            />
          </Typography>
        )}
        {props.options.headerLeft &&
          props.options.headerLeft({ canGoBack: true })}
      </View>
      <View className="flex-grow">
        {props.options.title && (
          <Typography variant="h2">{props.options.title}</Typography>
        )}
      </View>
      <View>
        {props.options.headerRight &&
          props.options.headerRight({ canGoBack: false })}
      </View>
    </View>
  );
};
