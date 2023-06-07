import { useCallback, useMemo, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  SafeAreaView,
  TextInput,
  TextInputChangeEventData,
  TextInputTextInputEventData,
  View,
} from "react-native";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";
import { logger } from "@fissa/utils";

import { Button, PageTemplate, Rejoin, Typography } from "../src/components";
import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from "../src/hooks/useEncryptedStorage";
import { toast } from "../src/utils/Toast";
import { api } from "../src/utils/api";

const Join = () => {
  const { replace } = useRouter();
  const { save } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.lastPin);
  const [pin, setPin] = useState(["", "", "", ""]);

  api.fissa.byId.useQuery(pin.join(""), {
    enabled: !pin.includes(""),
    onSuccess: ({ pin }) => {
      toast.success({ message: "Enjoy the fissa", icon: "🎉" });
      notificationAsync(NotificationFeedbackType.Success).catch(logger.warning);
      save(pin).catch(logger.warning);
      replace(`/fissa/${pin}`);
    },
    onError: ({ message }) => {
      toast.warn({ message });
      reset();
    },
  });

  const key1 = useRef<TextInput>(null);
  const key2 = useRef<TextInput>(null);
  const key3 = useRef<TextInput>(null);
  const key4 = useRef<TextInput>(null);

  const keys = useMemo(() => [key1, key2, key3, key4], [key1, key2, key3, key4]);

  const handleSelect = useCallback(
    (selectedIndex: number) => () => {
      keys.forEach(({ current }, index) => {
        if (index < selectedIndex) return;
        current?.clear();
      });
    },
    [],
  );

  const handlePress = useCallback(
    (index: number) => (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
      const { text } = e.nativeEvent;
      const nextIndex = index + (text === "" ? -1 : 1);
      const next = keys[nextIndex];
      next?.current?.focus();

      setPin((prev) => {
        const newPin = [...prev];
        newPin[index] = text;
        return newPin;
      });
    },
    [keys],
  );

  const handleTextInput = useCallback(
    (index: number) => (e: NativeSyntheticEvent<TextInputTextInputEventData>) => {
      const { text, previousText } = e.nativeEvent;
      if (text || previousText) return;

      const next = keys[index - 1];
      next?.current?.focus();
    },
    [keys],
  );

  const reset = useCallback(() => keys[0]?.current?.focus(), [keys]);

  return (
    <SafeAreaView style={{ backgroundColor: theme["900"] }}>
      <Stack.Screen options={{ headerBackVisible: true }} />
      <PageTemplate className="justify-start">
        <Typography variant="h5" centered className="mb-16">
          Enter the fissa code
        </Typography>
        <View className="flex-row justify-around space-x-4">
          {keys.map((key, index) => (
            <View className="flex-1" key={key.current?.props?.id ?? index}>
              <TextInput
                autoFocus={index === 0}
                ref={key}
                editable={pin.includes("")}
                onTextInput={handleTextInput(index)}
                onChange={handlePress(index)}
                onFocus={handleSelect(index)}
                placeholder="⦚"
                maxLength={1}
                keyboardType="numeric"
                inputMode="numeric"
                className="p-4 text-5xl font-extrabold text-center"
                style={{ color: theme["100"] }}
              />
              <View
                className="border-2"
                style={{
                  borderColor: theme[pin.indexOf("") === index ? "500" : "100"],
                }}
              />
            </View>
          ))}
        </View>

        <Button
          variant="text"
          title="clear code"
          className="mt-4 mb-8"
          onPress={reset}
          disabled={!pin.includes("")}
        />
        <Rejoin />
      </PageTemplate>
    </SafeAreaView>
  );
};

export default Join;
