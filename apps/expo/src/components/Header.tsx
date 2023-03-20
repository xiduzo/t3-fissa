import { FC } from "react";
import { Button, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type NativeStackHeaderProps } from "@react-navigation/native-stack";

import { Typography } from "./Typography";

export const Header: FC<NativeStackHeaderProps> = (props) => {
  const { back } = useRouter();

  return (
    <View className="flex flex-row items-center justify-between bg-theme-900 px-6 pt-12">
      <View>
        {props.back && (
          <Typography>
            <Ionicons name="arrow-back" size={24} title="back" onPress={back} />
          </Typography>
        )}
      </View>
      <Typography>{props.options.title}</Typography>
      <View>
        {props.options.headerRight &&
          props.options.headerRight({ canGoBack: false })}
      </View>
    </View>
  );
};
