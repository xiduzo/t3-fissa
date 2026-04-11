import { theme } from "@fissa/tailwind-config";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    TextInput,
    View,
    type NativeSyntheticEvent,
    type TextInputChangeEventData,
    type TextInputKeyPressEventData,
} from "react-native";

import { Button, PageTemplate, Typography } from "../src/components";
import { api } from "../src/utils/api";
import { toast } from "../src/utils/Toast";

const Join = () => {
  const { replace } = useRouter();
  const [pin, setPin] = useState(["", "", "", ""]);

  const key1 = useRef<TextInput>(null);
  const key2 = useRef<TextInput>(null);
  const key3 = useRef<TextInput>(null);
  const key4 = useRef<TextInput>(null);

  const keys = useMemo(() => [key1, key2, key3, key4], [key1, key2, key3, key4]);

  const reset = useCallback(() => {
    setPin(["", "", "", ""]);
    setTimeout(() => {
      keys[0]?.current?.focus();
    }, 100);
  }, [keys]);

  const { data, error, isFetching } = api.fissa.byId.useQuery(pin.join(""), {
    enabled: !pin.includes(""),
    retry: false,
  });

  useEffect(() => {
    if (!data) return;
    toast.success({ message: "Enjoy the fissa", icon: "🎉" });
    void notificationAsync(NotificationFeedbackType.Success);
    replace(`/fissa/${data.pin}`);
  }, [data, replace]);

  useEffect(() => {
    if (!error) return;
    reset();
    toast.hide();
    toast.warn({ message: error.message });
  }, [error, reset]);

  const handleFocus = useCallback(
    (selectedIndex: number) => () => {
      keys.forEach(({ current }, index) => {
        if (index < selectedIndex) return;
        current?.clear();
        setPin((prev) => {
          const newPin = [...prev];
          newPin[index] = "";
          return newPin;
        });
      });

      if (selectedIndex === 0) return;
      if (pin[selectedIndex - 1] === "") keys[selectedIndex - 1]?.current?.focus();
    },
    [keys, pin],
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

  const handleKeyPress = useCallback(
    (index: number) => (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key !== "Backspace") return;
      if (pin[index] !== "") return;

      const next = keys[index - 1];
      next?.current?.focus();
    },
    [keys, pin],
  );

  return (
    <PageTemplate className="justify-start gap-14">
      <Stack.Screen options={{ headerBackVisible: true }} />
      <Typography variant="h5" centered>
        Enter the session code of the Fissa you want to join
      </Typography>
      <View className="flex-row justify-around gap-4">
        {keys.map((key, index) => (
          <View className="flex-1" key={key.current?.props?.id ?? index}>
            <TextInput
              autoFocus={index === 0}
              ref={key}
              editable={pin.includes("")}
              onKeyPress={handleKeyPress(index)}
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
