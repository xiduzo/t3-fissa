import SpotifyWebApi from "spotify-web-api-node";

export class SpotifyService {
  public api = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });
  constructor() {}

  codeGrant = async (code: string, redirectUri: string) => {
    this.api.setRedirectURI(redirectUri);
    return this.api.authorizationCodeGrant(code);
  };

  me = async (accessToken: string) => {
    this.api.setAccessToken(accessToken);
    return this.api.getMe();
  };
}
