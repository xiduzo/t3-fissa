import { AnimationSpeed } from "@fissa/utils";
import { FlashList } from "@shopify/flash-list";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { IconButton, ListItem, PageTemplate } from "../../../src/components";
import { api } from "../../../src/utils";

const Members = () => {
  const { pin } = useGlobalSearchParams();
  const { back } = useRouter();

  const { data } = api.fissa.members.useQuery(String(pin), {
    enabled: !!pin,
  });


  return (
    <PageTemplate fullScreen className="px-6 pt-4">
      <Stack.Screen
        options={{
          title: "Top DJs",
          animation: "fade_from_bottom",
          animationDuration: AnimationSpeed.VeryFast,
          headerRight: () => <IconButton icon="close" title="back to fissa" onPress={back} />,
        }}
      />
      <View className="h-full w-full">
        <FlashList
          estimatedItemSize={48}
          data={data}
          renderItem={({ item }) => (
            <ListItem
              imageUri={item.user.image}
              title={item.user.name ?? "Anonymous"}
              subtitle={`${item.points} points`}
            />
          )} />
      </View>
    </PageTemplate>
  )
}

export default Members;
