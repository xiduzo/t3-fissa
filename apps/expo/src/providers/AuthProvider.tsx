import * as React from "react";
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AuthRequestPromptOptions,
  AuthSessionResult,
  DiscoveryDocument,
  RefreshTokenRequestConfig,
  ResponseType,
  TokenResponse,
  TokenResponseConfig,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import jwtDecode from "jwt-decode";

import { useEncryptedStorage } from "../hooks/useEncryptedStorage";
import { api } from "../utils/api";

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const SpotifyContext = createContext({
  promptAsync: (options?: AuthRequestPromptOptions | undefined) => {
    return new Promise<AuthSessionResult>((resolve, reject) => {
      reject("Not implemented");
    });
  },
});

export const SpotifyProvider: FC<PropsWithChildren> = ({ children }) => {
  // storing our user token
  const { mutateAsync } = api.auth.getTokensFromCode.useMutation();
  const { data } = api.auth.getSecretMessage.useQuery();
  console.log("message", data);

  // caching the token configuration, use secure storage in production app
  const { save, getValueFor } = useEncryptedStorage("jwtToken");

  const [request, response, promptAsync] = useAuthRequest(
    {
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
        scheme: "com.xiduzo.fissa:/redirect",
      }),
    },
    discovery,
  );

  const readTokenFromStorage = useCallback(async () => {
    // get the cached token config
    const tokenString = await getValueFor();
    // TODO: set session based on refresh token
    console.log(tokenString);
    // const tokenConfig: TokenResponseConfig = JSON.parse(tokenString ?? "");
    // if (tokenConfig) {
    //   // instantiate a new token response object which will allow us to refresh
    //   let tokenResponse = new TokenResponse(tokenConfig);

    //   // shouldRefresh checks the expiration and makes sure there is a refresh token
    //   if (tokenResponse.shouldRefresh()) {
    //     // All we need here is the clientID and refreshToken because the function handles setting our grant type based on
    //     // the type of request configuration (refreshtokenrequestconfig in our example)
    //     const refreshConfig: RefreshTokenRequestConfig = {
    //       clientId: request?.clientId!,
    //       refreshToken: tokenConfig.refreshToken,
    //     };

    //     const endpointConfig: Pick<DiscoveryDocument, "tokenEndpoint"> = {
    //       tokenEndpoint: discovery.tokenEndpoint,
    //     };

    //     // pass our refresh token and get a new access token and new refresh token
    //     tokenResponse = await tokenResponse.refreshAsync(
    //       refreshConfig,
    //       endpointConfig,
    //     );
    //   }
    //   // cache the token for next time
    //   save(JSON.stringify(tokenResponse.getRequestConfig()));

    //   // decode the jwt for getting profile information
    //   const decoded = jwtDecode(tokenResponse.accessToken);
    //   // storing token in state
    //   setUser({ jwtToken: tokenResponse.accessToken, decoded });
    // }
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      console.log(code);
      if (!code) return;
      mutateAsync({ code, redirectUri: request!.redirectUri }).then(
        (response) => {
          console.log(response);
        },
      );
    }
  }, [response, request]);

  useEffect(() => {
    readTokenFromStorage();
  }, [readTokenFromStorage]);

  return (
    <SpotifyContext.Provider value={{ promptAsync }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useAuth = () => useContext(SpotifyContext);
