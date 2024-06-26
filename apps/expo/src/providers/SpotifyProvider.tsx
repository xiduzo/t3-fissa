import { addMinutes, differenceInMinutes, scopes, useInterval, useSpotify } from "@fissa/utils";
import {
  Prompt,
  ResponseType,
  makeRedirectUri,
  useAuthRequest,
  type AuthRequestConfig,
  type DiscoveryDocument,
} from "expo-auth-session";
import Constants from "expo-constants";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
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

import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from "../hooks/useEncryptedStorage";
import { useOnActiveApp } from "../hooks/useOnActiveApp";
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
  isLoading: true
});

export const SpotifyProvider: FC<PropsWithChildren> = ({ children }) => {
  const spotify = useSpotify();
  const [user, setUser] = useState<SpotifyApi.CurrentUsersProfileResponse>();
  const { replace } = useRouter();
  const { getState } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

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
      void spotify.getMe().then(setUser);

      await saveSessionToken(session_token);

      lastTokenSaveTime.current = new Date();
      refresh_token && (await saveRefreshToken(refresh_token));
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

  const signIn = useCallback(() => {
    setIsLoading(true);
    void promptAsync().finally(() => setIsLoading(false));
  }, [promptAsync]);

  useEffect(() => {
    if (response?.type !== "success") return;

    toast.info({
      message: "Gathering account details",
      icon: "🐿️",
      duration: 30 * 1000,
    });

    void notificationAsync(NotificationFeedbackType.Success);

    void saveScopes(scopes.join("_"));

    const { code } = response.params;
    if (!code) return toast.error({ message: `Something went wrong...` });

    if (!request) return;
    const { redirectUri } = request;
    void mutateAsync({ code, redirectUri });
  }, [response, request, saveScopes, saveTokens, mutateAsync]);

  useEffect(() => {
    if (user) return;
    void getScopes().then((localScopes) => {
      if (String(localScopes) !== scopes.join("_")) return;

      void updateTokens();
    });
  }, [updateTokens, user, getScopes]);

  useOnActiveApp(() => {
    const difference = differenceInMinutes(new Date(), addMinutes(lastTokenSaveTime.current, -2));

    if (difference < REFRESH_INTERVAL_MINUTES) return;

    void updateTokens();
  });

  useInterval(() => {
    void updateTokens();
  }, REFRESH_INTERVAL_MINUTES * 60 * 1000);

  const contextValue = useMemo(() => ({ user, signOut, signIn, isLoading }), [user, signOut, signIn, isLoading]);

  return <SpotifyContext.Provider value={contextValue}>{children}</SpotifyContext.Provider>;
};

export const useAuth = () => useContext(SpotifyContext);

const config: AuthRequestConfig = {
  scopes: scopes,
  responseType: ResponseType.Code,
  clientId: Constants.expoConfig?.extra?.spotifyClientId as string,
  usePKCE: false,
  prompt: Prompt.SelectAccount,
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
  revocationEndpoint: "https://accounts.spotify.com/api/token",
};
