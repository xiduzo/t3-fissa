import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputChangeEventData,
  type TextInputTextInputEventData,
} from "react-native";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { theme } from "@fissa/tailwind-config";

import { Button, PageTemplate, Typography } from "../src/components";
import { api } from "../src/utils/api";
import { toast } from "../src/utils/Toast";

const Join = () => {
  const { replace } = useRouter();
  const [pin, setPin] = useState(["", "", "", ""]);

  const { isFetching } = api.fissa.byId.useQuery(pin.join(""), {
    enabled: !pin.includes(""),
    onSuccess: ({ pin }) => {
      toast.success({ message: "Enjoy the fissa", icon: "🎉" });
      void notificationAsync(NotificationFeedbackType.Success);
      replace(`/fissa/${pin}`);
    },
    onError: ({ message }) => {
      reset();
      toast.hide();
      toast.warn({ message });
    },
  });

  const key1 = useRef<TextInput>(null);
  const key2 = useRef<TextInput>(null);
  const key3 = useRef<TextInput>(null);
  const key4 = useRef<TextInput>(null);

  const keys = useMemo(() => [key1, key2, key3, key4], [key1, key2, key3, key4]);

  const handleFocus = useCallback(
    (selectedIndex: number) => () => {
      keys.forEach(({ current }, index) => {
        if (index < selectedIndex) return;
        current?.clear();
      });
    },
    [keys],
  );

  const handleChange = useCallback(
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

  const reset = useCallback(() => {
    setPin(["", "", "", ""]);
    setTimeout(() => {
      keys[0]?.current?.focus();
    }, 100);
  }, [keys]);

  useEffect(() => {
    if (pin.includes("")) return;

    toast.info({ message: `Joining Fissa ${pin.join("")}`, duration: 60000 });
  }, [pin]);

  return (
    <PageTemplate className="justify-start space-y-14">
      <Stack.Screen options={{ headerBackVisible: true }} />
      <Typography variant="h5" centered>
        Enter session code of the Fissa you want to join
      </Typography>
      <View className="flex-row justify-around space-x-4">
        {keys.map((key, index) => (
          <View className="flex-1" key={key.current?.props?.id ?? index}>
            <TextInput
              autoFocus={index === 0}
              ref={key}
              editable={pin.includes("")}
              onTextInput={handleTextInput(index)}
              onChange={handleChange(index)}
              onFocus={handleFocus(index)}
              placeholder="⦚"
              maxLength={1}
              keyboardType="numeric"
              inputMode="numeric"
              accessibilityLabel={`enter pin code digit ${index + 1} of 4`}
              className="p-4 text-center text-5xl font-extrabold"
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
      <Button variant="text" title="clear code" onPress={reset} disabled={isFetching} />
    </PageTemplate>
  );
};

export default Join;
