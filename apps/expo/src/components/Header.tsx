import { FC } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";

import { Typography } from "./Typography";

export const Header: FC<NativeStackHeaderProps> = (props) => {
  const { back } = useRouter();

  return (
    <View className="bg-theme-900 flex flex-row items-center justify-between px-6 pt-12">
      <View>
        {props.back && props.options.headerBackVisible && (
          <Typography>
            <Ionicons name="arrow-back" size={24} title="back" onPress={back} />
          </Typography>
        )}
      </View>
      <View>
        <Typography centered className="flex-grow">
          {props.options.title}
        </Typography>
      </View>
      <View>
        {props.options.headerRight &&
          props.options.headerRight({ canGoBack: false })}
      </View>
    </View>
  );
};
