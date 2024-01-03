import { type FC, type PropsWithChildren } from "react";

import { useTheme } from "~/providers/ThemeProvider";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  const { theme } = useTheme();
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
