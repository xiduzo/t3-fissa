import SpotifyWebApi from "spotify-web-api-node";

import { logger } from "../classes";

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
    } catch (e: any) {
      if (e.body.error.reason === "NO_ACTIVE_DEVICE") {
        logger.warning("No active device found, trying to transfer playback");
        const { body } = await this.spotify.getMyDevices();

        const firstDevice = body.devices[0];

        if (!firstDevice?.id) return logger.error("No device found");

        if (triesLeft === 0) return logger.error("No tries left");

        await this.spotify.transferMyPlayback([firstDevice.id]);
        await new Promise((resolve) => setTimeout(resolve, 250 + (3 % (triesLeft + 1))));
        return this.playTrack(accessToken, trackId, triesLeft - 1);
      }

      logger.error(JSON.stringify(e));

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
}
