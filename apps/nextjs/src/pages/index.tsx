import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { theme } from "@fissa/tailwind-config";

import { hexToRgb } from "~/utils/hexToRgb";
import { Layout } from "~/components/Layout";

const Home: NextPage = () => {
  const [pin, setPin] = useState(["", "", "", ""]);

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

  useEffect(() => {
    keys[0]?.current?.focus();
  }, [keys]);

  useEffect(() => {
    if (pin.includes("")) return;

    window.location.href = `/fissa/${pin.join("")}`;
  }, [pin]);

  return (
    <>
      <Head>
        <title>Fissa</title>
        <meta name="description" content="A collaborative Spotify playlist" />
        <link rel="icon" href="/icon.png" />
      </Head>
      <Layout>
        <section className="container mt-32 space-y-12">
          <h1 className="text-center text-3xl">
            Enter the session code of the Fissa you want to join
          </h1>
          <section className="m-auto flex max-w-md justify-between space-x-4 text-6xl">
            {keys.map((key, index) => (
              <div className="flex flex-col" key={index}>
                <input
                  autoFocus={index === 0}
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
                    borderColor: theme[pin.indexOf("") === index ? "500" : "100"],
                  }}
                />
              </div>
            ))}
          </section>
          <button
            disabled={!pin.includes("")}
            className="w-full rounded-full bg-opacity-0 p-4 font-bold transition-all duration-100 hover:bg-opacity-10"
            style={{
              background: `rgb(${hexToRgb(theme["100"]).rgb} / var(--tw-bg-opacity)`,
            }}
          >
            clear code
          </button>
        </section>
      </Layout>
    </>
  );
};

export default Home;
