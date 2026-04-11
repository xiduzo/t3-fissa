import { theme } from "@fissa/tailwind-config";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import type { TextStyle } from "react-native";

import { Button, PageTemplate, Typography } from "../src/components";
import { api } from "../src/utils/api";
import { toast } from "../src/utils/Toast";

const PIN_LENGTH = 4;

const inputStyle: TextStyle = {
  color: theme["100"],
  textAlign: "center",
};

const Join = () => {
  const { replace } = useRouter();
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null]);

  const pinString = pin.join("");
  const isComplete = !pin.includes("");

  const reset = useCallback(() => {
    setPin(Array(PIN_LENGTH).fill(""));
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const { data, error, isFetching } = api.fissa.byId.useQuery(pinString, {
    enabled: isComplete,
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

  const focusInput = (index: number) => {
    if (index >= 0 && index < PIN_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChangeText = useCallback(
    (index: number) => (text: string) => {
      // Only accept numeric input
      const digit = text.replace(/[^0-9]/g, "").slice(-1);

      setPin((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      if (digit !== "") {
        focusInput(index + 1);
      }
    },
    [],
  );

  const handleKeyPress = useCallback(
    (index: number) =>
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key !== "Backspace") return;

        setPin((prev) => {
          if (prev[index] !== "") {
            // Clear current field
            const next = [...prev];
            next[index] = "";
            return next;
          }
          // Field already empty — move back and clear previous
          if (index > 0) {
            const next = [...prev];
            next[index - 1] = "";
            focusInput(index - 1);
            return next;
          }
          return prev;
        });
      },
    [],
  );

  const handleFocus = useCallback(
    (index: number) => () => {
      // When tapping a later field, redirect to the first empty slot
      const firstEmpty = pin.indexOf("");
      if (firstEmpty !== -1 && firstEmpty < index) {
        focusInput(firstEmpty);
      }
    },
    [pin],
  );

  return (
    <PageTemplate className="justify-start gap-14">
      <Stack.Screen options={{ headerBackVisible: true }} />
      <Typography variant="h5" centered>
        Enter the session code of the Fissa you want to join
      </Typography>
      <View className="flex-row justify-around gap-4">
        {pin.map((digit, index) => (
          <View className="flex-1" key={index}>
            <TextInput
              autoFocus={index === 0}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={digit}
              editable={!isComplete}
              onKeyPress={handleKeyPress(index)}
              onChangeText={handleChangeText(index)}
              onFocus={handleFocus(index)}
              placeholder="⦚"
              placeholderTextColor={theme["100"] + "70"}
              maxLength={1}
              keyboardType="numeric"
              inputMode="numeric"
              accessibilityLabel={`enter pin code digit ${index + 1} of ${PIN_LENGTH}`}
              className="p-4 text-5xl font-extrabold"
              style={inputStyle}
            />
            <View
              className="border-2"
              style={{
                borderColor:
                  theme[pin.indexOf("") === index ? "500" : "100"],
              }}
            />
          </View>
        ))}
      </View>
      <Button
        variant="text"
        title="clear code"
        onPress={reset}
        disabled={isFetching}
      />
    </PageTemplate>
  );
};

export default Join;
