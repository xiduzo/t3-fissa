"use client"

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useTheme } from "~/providers/ThemeProvider";
import { api } from "~/utils/api";
import { toast } from "./Toast";

export function FissaCode() {
  const { theme } = useTheme();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [focussedIndex, setFocussedIndex] = useState(-1);

  api.fissa.byId.useQuery(pin.includes("") ? "" : pin.join(""), {
    retry: false,
    enabled: !pin.includes(""),
    onSuccess: (data) => {
      window.location.href = `/fissa/${data.pin}`;
    },
    onError: (error) => {
      toast.error({ message: error.message });
      handleClear();
    },
  });

  const key1 = useRef<HTMLInputElement>(null);
  const key2 = useRef<HTMLInputElement>(null);
  const key3 = useRef<HTMLInputElement>(null);
  const key4 = useRef<HTMLInputElement>(null);

  const keys = useMemo(() => [key1, key2, key3, key4], [key1, key2, key3, key4]);

  const handleFocus = useCallback(
    (selectedIndex: number) => () => {
      keys.forEach(({ current }, index) => {
        if (index < selectedIndex) return;
        if (!current) return;
        current.value = "";
        setPin((prev) => {
          const newPin = [...prev];
          newPin[index] = "";
          return newPin;
        });
      });

      setFocussedIndex(selectedIndex);
      if (selectedIndex === 0) return;
      if (pin[selectedIndex - 1] === "") keys[selectedIndex - 1]?.current?.focus();
    },
    [keys, pin],
  );

  const handleChange = useCallback(
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (isNaN(Number(value))) return;
      const nextIndex = index + (value === "" ? -1 : 1);
      const next = keys[nextIndex];
      setTimeout(() => {
        next?.current?.focus();
      }, 10);

      setFocussedIndex(nextIndex);
      setPin((prev) => {
        const newPin = [...prev];
        newPin[index] = value;
        return newPin;
      });
    },
    [keys],
  );

  const handleKeyDown = useCallback(
    (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Backspace") return;
      if (index === 0) return;
      if (pin[index] !== "") return;
      keys[index - 1]?.current?.focus();
    },
    [keys, pin],
  );

  const handleClear = useCallback(() => {
    setPin(["", "", "", ""]);
    setFocussedIndex(-1);
    setTimeout(() => {
      keys[0]?.current?.focus();
    }, 100);
  }, [keys]);

  return (
    <section className="container mx-auto mt-32 space-y-12">
      <section className="m-auto flex max-w-md justify-between space-x-4 text-6xl">
        {keys.map((key, index) => (
          <div className="flex flex-col" key={index}>
            <input
              value={pin[index]}
              ref={key}
              type="text"
              className="w-full rounded-md border-none bg-transparent text-center focus:outline-none"
              placeholder="⦚"
              maxLength={1}
              inputMode="numeric"
              disabled={!pin.includes("")}
              onFocus={handleFocus(index)}
              onKeyDown={handleKeyDown(index)}
              onChange={handleChange(index)}
            />
            <div
              className="border-2"
              style={{
                borderColor: theme[focussedIndex === index ? "500" : "100"],
              }}
            />
          </div>
        ))}
      </section>
      <button
        disabled={!pin.includes("")}
        onClick={handleClear}
        className="w-full rounded-full p-4 font-bold hover:bg-gray-100/10 transition-all duration-150"
      >
        clear code
      </button>
    </section>
  )
}
