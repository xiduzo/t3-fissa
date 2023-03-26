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
import {
  AuthRequestConfig,
  AuthRequestPromptOptions,
  AuthSessionResult,
  DiscoveryDocument,
  ResponseType,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import { SpotifyWebApi } from "@fissa/utils";

import {
  ENCRYPTED_STORAGE_KEYS,
  useEncryptedStorage,
} from "../hooks/useEncryptedStorage";
import { toast } from "../utils";
import { api } from "../utils/api";

const SpotifyContext = createContext({
  promptAsync: (options?: AuthRequestPromptOptions | undefined) => {
    return new Promise<AuthSessionResult>((resolve, reject) => {
      reject("Not implemented");
    });
  },
  user: undefined as SpotifyApi.CurrentUsersProfileResponse | undefined,
  spotify: new SpotifyWebApi(),
});

export const SpotifyProvider: FC<PropsWithChildren> = ({ children }) => {
  const spotify = useRef(new SpotifyWebApi());
  const [user, setUser] = useState<SpotifyApi.CurrentUsersProfileResponse>();

  const { mutateAsync } = api.auth.getTokensFromCode.useMutation();
  const { mutateAsync: refresh } = api.auth.refreshToken.useMutation();

  const { save: saveRefreshToken, getValueFor } = useEncryptedStorage(
    ENCRYPTED_STORAGE_KEYS.refreshToken,
  );
  const { save: saveSessionToken } = useEncryptedStorage(
    ENCRYPTED_STORAGE_KEYS.sessionToken,
  );

  const [request, response, promptAsync] = useAuthRequest(config, discovery);

  // TODO: refresh token once in a while
  const readTokenFromStorage = useCallback(async () => {
    const refreshToken = await getValueFor();
    if (!refreshToken) return;

    try {
      const { access_token, session_token } = await refresh(refreshToken);
      spotify.current.setAccessToken(access_token);
      spotify.current.getMe().then(setUser);
      await saveSessionToken(session_token);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useMemo(async () => {
    if (response?.type !== "success") return;

    toast.success({
      message: "Logged in successfully, setting account details.",
    });
    const { code } = response.params;
    if (!code) return;

    const { access_token, refresh_token, session_token } = await mutateAsync({
      code,
      redirectUri: request!.redirectUri,
    });

    spotify.current.setAccessToken(access_token);
    spotify.current.getMe().then(setUser);
    await saveRefreshToken(refresh_token);
    await saveSessionToken(session_token);
  }, [response, request, setUser]);

  useEffect(() => {
    readTokenFromStorage();
  }, [readTokenFromStorage]);

  return (
    <SpotifyContext.Provider
      value={{ promptAsync, user, spotify: spotify.current }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export const useAuth = () => useContext(SpotifyContext);
export const useSpotify = () => {
  const { spotify } = useAuth();
  return spotify;
};

const config: AuthRequestConfig = {
  scopes: [
    // Read
    "user-read-email",
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
  ],
  responseType: ResponseType.Code,
  clientId: "a2a88c4618324942859ce3e1f888b938",
  usePKCE: false,
  redirectUri: makeRedirectUri({
    scheme: "xiduzo.fissa:/redirect",
  }),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};
