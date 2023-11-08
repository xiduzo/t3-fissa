import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";
import {
  ResponseType,
  makeRedirectUri,
  useAuthRequest,
  type AuthRequestConfig,
  type DiscoveryDocument,
} from "expo-auth-session";
import Constants from "expo-constants";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { useInterval } from "@fissa/hooks";
import { differenceInMinutes, scopes, useSpotify } from "@fissa/utils";

import { useOnActiveApp } from "../hooks";
import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from "../hooks/useEncryptedStorage";
import { toast } from "../utils";
import { api } from "../utils/api";

const REFRESH_INTERVAL_MINUTES = 30;

const SpotifyContext = createContext({
  signOut: (): void => {
    return;
  },
  signIn: (): void => {
    return;
  },
  user: undefined as SpotifyApi.CurrentUsersProfileResponse | undefined,
});

export const SpotifyProvider: FC<PropsWithChildren> = ({ children }) => {
  const spotify = useSpotify();
  const [user, setUser] = useState<SpotifyApi.CurrentUsersProfileResponse>();
  const { replace } = useRouter();
  const { getState } = useNavigation();

  const lastTokenSaveTime = useRef(new Date());

  const { mutateAsync } = api.auth.getTokensFromCode.useMutation({
    onSuccess: async (tokens) => {
      await saveTokens(tokens);
    },
    onSettled: () => {
      setTimeout(() => {
        toast.hide();
      }, 1000);
    },
  });
  const { mutateAsync: refresh } = api.auth.refreshToken.useMutation();

  const { save: saveRefreshToken, getValueFor: getRefreshToken } = useEncryptedStorage(
    ENCRYPTED_STORAGE_KEYS.refreshToken,
  );
  const { save: saveSessionToken } = useEncryptedStorage(ENCRYPTED_STORAGE_KEYS.sessionToken);

  const { save: saveScopes, getValueFor: getScopes } = useEncryptedStorage(
    ENCRYPTED_STORAGE_KEYS.scopes,
  );

  const [request, response, promptAsync] = useAuthRequest(config, discovery);

  const saveTokens = useCallback(
    async (props: { access_token: string; session_token?: string; refresh_token?: string }) => {
      const { access_token, refresh_token, session_token } = props;

      if (!session_token) return;
      spotify.setAccessToken(access_token);
      spotify.getMe().then(setUser).catch(console.log);

      await saveSessionToken(session_token);

      refresh_token && (await saveRefreshToken(refresh_token));
      lastTokenSaveTime.current = new Date();
    },
    [spotify, saveSessionToken, saveRefreshToken],
  );

  const updateTokens = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return;

    try {
      const tokens = await refresh(refreshToken);
      await saveTokens(tokens);
    } catch (e) {
      setUser(undefined);
      const state = getState();

      if (state.routes[0]?.name === "index") return;
      replace("");
    }
  }, [replace, getState, getRefreshToken, saveTokens, refresh]);

  const signOut = useCallback(async () => {
    await saveSessionToken("");
    await saveRefreshToken("");
    setUser(undefined);
    replace("");
  }, [saveRefreshToken, saveSessionToken, replace]);

  const signIn = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  useEffect(() => {
    if (response?.type !== "success") return;

    toast.info({
      message: "Setting account details",
      icon: "🐿️",
      duration: 30 * 1000,
    });

    notificationAsync(NotificationFeedbackType.Success).catch(console.info);

    saveScopes(scopes.join("_")).catch(console.info);

    const { code } = response.params;
    if (!code) return toast.error({ message: `Something went wrong...` });

    if (!request) return;
    const { redirectUri } = request;
    mutateAsync({ code, redirectUri }).catch(console.info);
  }, [response, request, saveScopes, saveTokens, mutateAsync]);

  useEffect(() => {
    if (user) return;
    getScopes()
      .then((localScopes) => {
        if (String(localScopes) !== scopes.join("_")) return;

        updateTokens().catch(console.info);
      })
      .catch(console.info);
  }, [updateTokens, user, getScopes]);

  useOnActiveApp(() => {
    const { current } = lastTokenSaveTime;
    const difference = differenceInMinutes(new Date(), current);

    if (difference < REFRESH_INTERVAL_MINUTES) {
      return;
    }

    updateTokens().catch(console.info);
  });

  useInterval(() => {
    updateTokens().catch(console.info);
  }, REFRESH_INTERVAL_MINUTES * 60 * 1000);

  const contextValue = useMemo(() => ({ user, signOut, signIn }), [user, signOut, signIn]);

  return <SpotifyContext.Provider value={contextValue}>{children}</SpotifyContext.Provider>;
};

export const useAuth = () => useContext(SpotifyContext);

const config: AuthRequestConfig = {
  scopes: scopes,
  responseType: ResponseType.Code,
  clientId: Constants.expoConfig?.extra?.spotifyClientId as string,
  usePKCE: false,
  redirectUri: makeRedirectUri({
    scheme: `${Constants.expoConfig?.scheme}://redirect`,
    native: Platform.select({
      ios: `${Constants.expoConfig?.scheme}://redirect`,
      android: `${Constants.expoConfig?.scheme}://redirect`,
    }),
  }),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};
