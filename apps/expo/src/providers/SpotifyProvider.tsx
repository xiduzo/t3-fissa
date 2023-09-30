import * as React from "react";
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  AuthRequestConfig,
  DiscoveryDocument,
  ResponseType,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import Constants from "expo-constants";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { useInterval } from "@fissa/hooks";
import { differenceInMinutes, logger, scopes, useSpotify } from "@fissa/utils";

import { useOnActiveApp } from "../hooks";
import { ENCRYPTED_STORAGE_KEYS, useEncryptedStorage } from "../hooks/useEncryptedStorage";
import { toast } from "../utils";
import { api } from "../utils/api";

const REFRESH_INTERVAL_MINUTES = 30;

const SpotifyContext = createContext({
  signOut: () => {},
  signIn: () => {},
  user: undefined as SpotifyApi.CurrentUsersProfileResponse | undefined,
});

export const SpotifyProvider: FC<PropsWithChildren> = ({ children }) => {
  const spotify = useSpotify();
  const [user, setUser] = useState<SpotifyApi.CurrentUsersProfileResponse>();
  const { replace } = useRouter();
  const { getState } = useNavigation();

  const lastTokenSaveTime = useRef(new Date());

  const { mutateAsync } = api.auth.getTokensFromCode.useMutation();
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
      spotify.getMe().then(setUser).catch(logger.warning);

      await saveSessionToken(session_token);

      refresh_token && (await saveRefreshToken(refresh_token));
      lastTokenSaveTime.current = new Date();
    },
    [spotify],
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
  }, [user, replace, getState]);

  const signOut = useCallback(async () => {
    await saveSessionToken("");
    await saveRefreshToken("");
    setUser(undefined);
    replace("");
  }, []);

  const signIn = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  useMemo(async () => {
    if (response?.type !== "success") return;

    toast.info({
      message: "Getting account details",
      icon: "🐿️",
      duration: 30 * 1000,
    });

    await notificationAsync(NotificationFeedbackType.Success);

    await saveScopes(scopes.join("_"));

    const { code } = response.params;
    if (!code) return toast.error({ message: `Something went wrong...` });

    const { redirectUri } = request!;
    const tokens = await mutateAsync({ code, redirectUri });

    toast.hide();

    await saveTokens(tokens);
  }, [response, request, saveScopes, saveTokens]);

  useMemo(async () => {
    if (user) return;
    const localScopes = await getScopes();

    if (String(localScopes) !== scopes.join("_")) return;

    await updateTokens();
  }, [updateTokens, user, getScopes]);

  useOnActiveApp(async () => {
    const { current } = lastTokenSaveTime;
    const difference = differenceInMinutes(new Date(), current);

    if (difference < REFRESH_INTERVAL_MINUTES) return;
    await updateTokens();
  });

  useInterval(updateTokens, REFRESH_INTERVAL_MINUTES * 60 * 1000);

  return (
    <SpotifyContext.Provider value={{ user, signOut, signIn }}>{children}</SpotifyContext.Provider>
  );
};

export const useAuth = () => useContext(SpotifyContext);

const config: AuthRequestConfig = {
  scopes: scopes,
  responseType: ResponseType.Code,
  clientId: Constants.expoConfig?.extra?.spotifyClientId,
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
