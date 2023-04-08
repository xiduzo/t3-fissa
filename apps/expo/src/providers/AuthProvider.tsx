import * as React from "react";
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  AuthRequestConfig,
  AuthRequestPromptOptions,
  AuthSessionResult,
  DiscoveryDocument,
  ResponseType,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import * as BackgroundFetch from "expo-background-fetch";
import Constants from "expo-constants";
import * as TaskManager from "expo-task-manager";
import { differenceInMinutes, useInterval, useSpotify } from "@fissa/utils";

import { useOnActiveApp } from "../hooks";
import {
  ENCRYPTED_STORAGE_KEYS,
  useEncryptedStorage,
} from "../hooks/useEncryptedStorage";
import { toast } from "../utils";
import { api } from "../utils/api";

const REFRESH_INTERVAL_MINUTES = 45;
const BACKGROUND_FETCH_TASK = "background-fetch";

const SpotifyContext = createContext({
  promptAsync: (options?: AuthRequestPromptOptions | undefined) => {
    return new Promise<AuthSessionResult>((resolve, reject) => {
      reject("Not implemented");
    });
  },
  user: undefined as SpotifyApi.CurrentUsersProfileResponse | undefined,
});

export const SpotifyProvider: FC<PropsWithChildren> = ({ children }) => {
  const spotify = useSpotify();
  const [user, setUser] = useState<SpotifyApi.CurrentUsersProfileResponse>();

  const lastRefreshTokenFetchTime = useRef(new Date());

  const { mutateAsync } = api.auth.getTokensFromCode.useMutation();
  const { mutateAsync: refresh } = api.auth.refreshToken.useMutation();

  const { save: saveRefreshToken, getValueFor } = useEncryptedStorage(
    ENCRYPTED_STORAGE_KEYS.refreshToken,
  );
  const { save: saveSessionToken } = useEncryptedStorage(
    ENCRYPTED_STORAGE_KEYS.sessionToken,
  );

  const { save: saveScopes, getValueFor: getScopes } = useEncryptedStorage(
    ENCRYPTED_STORAGE_KEYS.scopes,
  );

  const [request, response, promptAsync] = useAuthRequest(config, discovery);

  const readTokenFromStorage = useCallback(async () => {
    const refreshToken = await getValueFor();
    if (!refreshToken) return;

    try {
      const { access_token, session_token } = await refresh(refreshToken);
      spotify.setAccessToken(access_token);
      spotify.getMe().then(setUser);
      await saveSessionToken(session_token);
      lastRefreshTokenFetchTime.current = new Date();
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useMemo(async () => {
    if (response?.type !== "success") return;

    toast.success({
      message: "Setting account details",
      duration: 30 * 1000,
    });

    await saveScopes(scopes.join("_"));

    const { code } = response.params;
    if (!code) return toast.error({ message: `Something went wrong...` });

    const { access_token, refresh_token, session_token } = await mutateAsync({
      code,
      redirectUri: request!.redirectUri,
    });

    toast.hide();

    spotify.setAccessToken(access_token);
    spotify.getMe().then(setUser);
    await saveRefreshToken(refresh_token);
    await saveSessionToken(session_token);
  }, [response, request, setUser, saveScopes]);

  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    console.log("background fetch token");
    await readTokenFromStorage();

    // Be sure to return the successful result type!
    return BackgroundFetch.BackgroundFetchResult.NoData;
  });

  useMemo(async () => {
    if (user) return;
    const localScopes = await getScopes();

    if (!localScopes) return;
    if (localScopes !== scopes.join("_")) return;

    await readTokenFromStorage();

    const unregister = await registerBackgroundFetchAsync();

    return unregister;
  }, [readTokenFromStorage, user, getScopes]);

  useOnActiveApp(() => {
    const difference = differenceInMinutes(
      new Date(),
      lastRefreshTokenFetchTime.current,
    );
    if (difference < REFRESH_INTERVAL_MINUTES) return;
    readTokenFromStorage();
  });

  return (
    <SpotifyContext.Provider value={{ promptAsync, user }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useAuth = () => useContext(SpotifyContext);

const scopes = [
  // Read
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-top-read",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  // Modify
  "playlist-modify-public",
  "user-modify-playback-state",
  "user-library-modify",
];

const config: AuthRequestConfig = {
  scopes,
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

const registerBackgroundFetchAsync = async () => {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 1,
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });

  console.log("registered background fetch task");

  return () => {
    console.log("unregistered background fetch task");
    BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  };
};
