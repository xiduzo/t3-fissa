import SpotifyWebApi from "spotify-web-api-node";

export class SpotifyService {
  public spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  codeGrant = async (code: string, redirectUri: string) => {
    this.spotify.setRedirectURI(redirectUri);
    return this.spotify.authorizationCodeGrant(code);
  };

  refresh = async (refreshToken: string) => {
    this.spotify.setRefreshToken(refreshToken);
    return this.spotify.refreshAccessToken();
  };

  me = async (accessToken: string) => {
    this.spotify.setAccessToken(accessToken);
    return this.spotify.getMe();
  };

  playTrack = async (accessToken: string, trackId: string) => {
    this.spotify.setAccessToken(accessToken);

    const { body } = await this.spotify.getTrack(trackId);
    return this.spotify.play({
      device_id: (await this.getActiveDevice(accessToken))?.id ?? undefined,
      uris: [body.uri],
    });
  };

  isStillPlaying = async (accessToken: string) => {
    this.spotify.setAccessToken(accessToken);
    const { body } = await this.spotify.getMyCurrentPlaybackState();
    return body.is_playing;
  };

  private getActiveDevice = async (accessToken: string) => {
    this.spotify.setAccessToken(accessToken);
    const { body } = await this.spotify.getMyDevices();
    const activeDevice = body.devices.find((device) => device.is_active);
    if (!activeDevice) return body.devices[0];
    return activeDevice;
  };
}
