import SpotifyWebApi from "spotify-web-api-node";

import { UnableToPlayTrack } from "../classes";
import { sleep } from "../sleep";

const TRIES_TO_PLAY = 3;

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

  playTrack = async (accessToken: string, trackId: string, trial = 0): Promise<boolean> => {
    this.spotify.setAccessToken(accessToken);

    try {
      await this.spotify.play({ uris: [`spotify:track:${trackId}`] });
      await sleep(1500); // Arbitrary wait time, sue me
      const { body } = await this.spotify.getMyCurrentPlaybackState();
      return Promise.resolve(body.is_playing);
    } catch (e: unknown) {
      if (trial > TRIES_TO_PLAY) throw new UnableToPlayTrack("Could not play track");

      const error = e as { body: { error: { reason: string } } };
      const reason = error?.body?.error?.reason ?? "";
      if (reason === "NO_ACTIVE_DEVICE") {
        console.warn("No active device found, trying to transfer playback");
        const { body } = await this.spotify.getMyDevices();

        const firstDevice = body.devices[0];

        if (!firstDevice?.id) throw new UnableToPlayTrack("No playback device(s) found");

        await this.spotify.transferMyPlayback([firstDevice.id]);
        await sleep(1500); // Arbitrary wait time, sue me
        return this.playTrack(accessToken, trackId, trial + 1);
      }

      return Promise.resolve(false);
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
