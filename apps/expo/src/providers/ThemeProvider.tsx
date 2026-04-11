import { themes, getThemeForUser, type Theme } from "@fissa/tailwind-config/themes";
import { createContext, useContext, useEffect, useState, type FC, type PropsWithChildren } from "react";
import * as SecureStore from "expo-secure-store";

import { useAuth } from "./SpotifyProvider";

const THEME_CACHE_KEY = "fissa_theme";

const defaultTheme = themes[0]!;

const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // On mount, restore the last known theme from storage so there's no flash
  useEffect(() => {
    void SecureStore.getItemAsync(THEME_CACHE_KEY).then((cached) => {
      if (!cached) return;
      const found = themes.find((t) => t.name === cached);
      if (found) setTheme(found);
    });
  }, []);

  // Once the user is available, derive the real theme and persist it
  useEffect(() => {
    if (!user?.id) return;
    const resolved = getThemeForUser(user.id);
    setTheme(resolved);
    void SecureStore.setItemAsync(THEME_CACHE_KEY, resolved.name);
  }, [user?.id]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
