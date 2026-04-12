import { extrodonary, type Theme } from "@fissa/tailwind-config/themes";
import { createContext, useContext, type FC, type PropsWithChildren } from "react";

const ThemeContext = createContext<{ theme: Theme }>({ theme: extrodonary });

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  return <ThemeContext.Provider value={{ theme: extrodonary }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
