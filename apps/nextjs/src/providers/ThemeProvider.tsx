import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { theme } from "@fissa/tailwind-config";

const ThemeContext = createContext({ theme });

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [colors, setColors] = useState(theme);

  useEffect(() => {
    setColors(theme);
  }, []);
  return <ThemeContext.Provider value={{ theme: colors }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
