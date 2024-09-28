import { themes, type Theme } from "@fissa/tailwind-config";
import { createContext, useContext, type FC, type PropsWithChildren } from "react";

function getTheme() {
  const minute = new Date().getMinutes();

  return themes.at(Math.floor(minute / 10))
}

const theme = getTheme() as Theme;

const ThemeContext = createContext({ theme });

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
