import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  SafeAreaView,
  TextInput,
  TextInputChangeEventData,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { cva } from "@fissa/utils";

import { Button } from "../src/components/Button";
import { Header } from "../src/components/Header";
import { Typography } from "../src/components/Typography";
import { useEncryptedStorage } from "../src/hooks/useEncryptedStorage";
import { toast } from "../src/utils/Toast";
import { api } from "../src/utils/api";

const Join = () => {
  const [pin, setPin] = useState(["", "", "", ""]);
  const { replace } = useRouter();
  const { save } = useEncryptedStorage("pin");

  api.room.byId.useQuery(pin.join(""), {
    enabled: !pin.includes(""),
    onError: async (error) => {
      toast.warn({ message: error.message });
      reset();
    },
    onSuccess: async ({ pin }) => {
      await save(pin);

      replace(`/room/${pin}`);
    },
  });

  const key1 = useRef<TextInput>(null);
  const key2 = useRef<TextInput>(null);
  const key3 = useRef<TextInput>(null);
  const key4 = useRef<TextInput>(null);

  const keys = useMemo(
    () => [key1, key2, key3, key4],
    [key1, key2, key3, key4],
  );

  const handleChange = useCallback(
    (index: number) => (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
      const newCode = [...pin];
      const input = e.nativeEvent.text.toUpperCase();

      if (!input.match(/\w/)) return;
      if (input.match(/\d/)) return;

      newCode[index] = input;
      setPin(newCode);

      if (index >= pin.length) return;

      const next = keys[index + 1];
      next?.current?.focus();
    },
    [pin],
  );

  const handleBack = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (index === 0) return;
        if (event.nativeEvent?.key.toLowerCase() !== "backspace") return;
        keys[index - 1]?.current?.focus();
      },
    [pin],
  );

  const handleSelect = useCallback(
    (index: number) => () => {
      const newCode = [...pin].map((code, codeIndex) => {
        if (codeIndex >= index) return "";
        return code;
      });

      setPin(newCode);

      const emptyIndex = pin.findIndex((code) => code === "");
      if (emptyIndex === -1) return;

      keys[emptyIndex]?.current?.focus();
    },
    [pin],
  );

  const reset = useCallback(() => {
    setPin(["", "", "", ""]);
    setTimeout(() => {
      keys[0]?.current?.focus();
    }, 0);
  }, [keys]);

  useEffect(() => {
    keys[0]?.current?.focus();
  }, [keys]);

  return (
    <SafeAreaView className="bg-theme-900">
      <Stack.Screen
        options={{
          header: (props) => <Header {...props} />,
        }}
      />
      <View className="mt-6 flex h-full w-full space-y-16 px-6">
        <Typography variant="h5" centered>
          Enter the fissa code
        </Typography>
        <View className="flex flex-row justify-around">
          {pin.map((value, index) => (
            <View className="flex w-[20vw] px-2" key={index}>
              <TextInput
                ref={keys[index]}
                value={value}
                onKeyPress={handleBack(index)}
                onChange={handleChange(index)}
                onFocus={handleSelect(index)}
                placeholder="⦚"
                maxLength={1}
                className="text-theme-100 p-4 text-center text-5xl font-extrabold"
              />
              <View
                className={underline({ active: pin.indexOf("") === index })}
              />
            </View>
          ))}
        </View>
        <Button variant="text" title="reset" disabled={!pin.includes("")} />
      </View>
    </SafeAreaView>
  );
};

export default Join;

const underline = cva("border-2", {
  variants: {
    active: {
      true: "border-theme-500",
      false: "border-theme-100",
    },
  },
});
