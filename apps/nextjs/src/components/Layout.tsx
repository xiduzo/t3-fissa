import { type FC, type PropsWithChildren } from "react";
import { theme } from "@fissa/tailwind-config";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <main
      className="min-h-screen w-screen p-3 md:p-6 lg:p-12"
      style={{
        background: theme["900"],
        color: theme["100"],
      }}
    >
      {children}
    </main>
  );
};
