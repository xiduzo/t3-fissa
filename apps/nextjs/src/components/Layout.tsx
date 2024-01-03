import { useEffect, useState, type FC, type PropsWithChildren } from "react";
import { theme } from "@fissa/tailwind-config";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  const [colors, setColors] = useState(theme);
  useEffect(() => {
    setColors(theme);
  }, []);

  return (
    <main
      className="min-h-screen w-screen p-3 md:p-6 lg:p-12"
      style={{
        background: colors["900"],
        color: colors["100"],
      }}
    >
      {children}
    </main>
  );
};
