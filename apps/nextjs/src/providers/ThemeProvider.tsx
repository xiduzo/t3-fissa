import { createContext, useContext, useEffect, type FC, type PropsWithChildren } from "react";
import { theme } from "@fissa/tailwind-config";

const ThemeContext = createContext({ theme });

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  // const [selectedTheme, setSelectedTheme] = useLocalStorage("theme", theme);

  // console.log(theme, selectedTheme);
  // useEffect(() => {

  // }, [selectedTheme])
  // const theme = useRef

  // TODO: make this neater
  useEffect(() => {
    document.getElementsByTagName("main")[0]?.style.setProperty("background-color", theme["900"]);
    document.getElementsByTagName("html")[0]?.style.setProperty("color", theme["100"]);
  }, []);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
