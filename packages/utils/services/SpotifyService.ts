import SpotifyWebApi from "spotify-web-api-node";

export class SpotifyService {
  private spotify = new SpotifyWebApi({
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

  playTrack = async (accessToken: string, trackId: string, triesLeft = 3): Promise<unknown> => {
    this.spotify.setAccessToken(accessToken);

    try {
      await this.spotify.play({ uris: [`spotify:track:${trackId}`] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if ((e as { body: { error: { reason: string } } }).body.error.reason === "NO_ACTIVE_DEVICE") {
        console.log("No active device found, trying to transfer playback");
        const { body } = await this.spotify.getMyDevices();

        const firstDevice = body.devices[0];

        if (!firstDevice?.id) throw new Error("No playback device(s) found");

        if (triesLeft === 0) throw new Error("Could not transfer playback");

        await this.spotify.transferMyPlayback([firstDevice.id]);
        await new Promise((resolve) => setTimeout(resolve, 250 + (3 % (triesLeft + 1))));
        return this.playTrack(accessToken, trackId, triesLeft - 1);
      }

      console.error(JSON.stringify(e));

      return Promise.resolve();
    }
  };

  getRecommendedTracks = async (accessToken: string, seedTrackIds: string[]) => {
    this.spotify.setAccessToken(accessToken);

    const me = await this.me(accessToken);

    const { body } = await this.spotify.getRecommendations({
      seed_tracks: seedTrackIds.slice(0, Math.min(5, seedTrackIds.length)),
      market: me.body.country,
      limit: 5,
    });

    return body.tracks;
  };

  pause = async (accessToken: string) => {
    this.spotify.setAccessToken(accessToken);
    return this.spotify.pause();
  };
}
