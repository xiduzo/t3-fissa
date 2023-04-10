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

  isStillPlaying = async (accessToken: string) => {
    this.spotify.setAccessToken(accessToken);
    const { body } = await this.spotify.getMyCurrentPlaybackState();
    return body.is_playing;
  };

  playTrack = async (accessToken: string, trackId: string) => {
    this.spotify.setAccessToken(accessToken);

    const { body } = await this.spotify.getTrack(trackId);
    console.log("playing", body.name);
    return this.spotify.play({ uris: [body.uri] });
  };

  getRecommendedTracks = async (
    accessToken: string,
    seedTrackIds: string[],
  ) => {
    this.spotify.setAccessToken(accessToken);
    const { body } = await this.spotify.getRecommendations({
      seed_tracks: seedTrackIds,
      limit: 5,
    });
    return body.tracks;
  };
}
