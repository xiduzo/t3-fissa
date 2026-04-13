import SpotifyWebApi from "spotify-web-api-node";

import { UnableToPlayTrack, sleep } from "@fissa/utils";

import type { ISpotifyService } from "../interfaces";

const TRIES_TO_PLAY = 3;

export class SpotifyService implements ISpotifyService {
  private createClient(accessToken?: string) {
    const client = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    if (accessToken) client.setAccessToken(accessToken);
    return client;
  }

  codeGrant = async (code: string, redirectUri: string) => {
    const client = this.createClient();
    client.setRedirectURI(redirectUri);
    return client.authorizationCodeGrant(code);
  };

  refresh = async (refreshToken: string) => {
    const client = this.createClient();
    client.setRefreshToken(refreshToken);
    return client.refreshAccessToken();
  };

  me = async (accessToken: string) => {
    return this.createClient(accessToken).getMe();
  };

  isStillPlaying = async (accessToken: string) => {
    const { body } = await this.createClient(accessToken).getMyCurrentPlaybackState();
    return body.is_playing;
  };

  playTrack = async (accessToken: string, trackId: string, trial = 0): Promise<boolean> => {
    const client = this.createClient(accessToken);

    try {
      await client.play({ uris: [`spotify:track:${trackId}`] });
      await sleep(1500);
      const { body } = await client.getMyCurrentPlaybackState();
      return Promise.resolve(body.is_playing);
    } catch (e: unknown) {
      if (trial > TRIES_TO_PLAY) throw new UnableToPlayTrack("Could not play track");

      const error = e as { body: { error: { reason: string } } };
      const reason = error?.body?.error?.reason ?? "";
      if (reason === "NO_ACTIVE_DEVICE") {
        console.warn("No active device found, trying to transfer playback");
        const { body } = await client.getMyDevices();

        const firstDevice = body.devices[0];

        if (!firstDevice?.id) throw new UnableToPlayTrack("No playback device(s) found");

        await client.transferMyPlayback([firstDevice.id]);
        await sleep(1500);
        return this.playTrack(accessToken, trackId, trial + 1);
      }

      return Promise.resolve(false);
    }
  };

  getRecommendedTracks = async (accessToken: string, seedTrackIds: string[]) => {
    const client = this.createClient(accessToken);

    const me = await client.getMe();

    const { body } = await client.getRecommendations({
      seed_tracks: seedTrackIds.slice(0, Math.min(5, seedTrackIds.length)),
      market: me.body.country,
      limit: 5,
    });

    return body.tracks;
  };

  pause = async (accessToken: string): Promise<void> => {
    await this.createClient(accessToken).pause();
  };
}
