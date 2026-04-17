import SpotifyWebApi from "spotify-web-api-node";

import { UnableToPlayTrack, sleep } from "@fissa/utils";

import type { ISpotifyService } from "../interfaces";

const MAX_RETRIES = 3;

type SpotifyErrorShape = {
  body: { error: { reason: string; status: number } };
  statusCode?: number;
};

function parseSpotifyError(e: unknown) {
  const err = e as SpotifyErrorShape;
  return {
    reason: err?.body?.error?.reason ?? "",
    status: err?.statusCode ?? err?.body?.error?.status ?? 0,
  };
}

function isHardFailure(e: unknown): boolean {
  const { reason, status } = parseSpotifyError(e);
  return status === 403 || reason === "NO_ACTIVE_DEVICE" || reason === "RESTRICTION_VIOLATED";
}

export class SpotifyService implements ISpotifyService {
  private createClient(accessToken?: string) {
    const client = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    if (accessToken) client.setAccessToken(accessToken);
    return client;
  }

  private withRetry = async <T>(fn: () => Promise<T>, trial = 0): Promise<T> => {
    try {
      return await fn();
    } catch (e: unknown) {
      if (isHardFailure(e) || trial >= MAX_RETRIES) throw e;
      await sleep(1500 * (trial + 1));
      return this.withRetry(fn, trial + 1);
    }
  };

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
    return this.withRetry(() => this.createClient(accessToken).getMe());
  };

  isStillPlaying = async (accessToken: string) => {
    const { body } = await this.withRetry(() =>
      this.createClient(accessToken).getMyCurrentPlaybackState(),
    );
    return body.is_playing;
  };

  playTrack = async (accessToken: string, trackId: string, trial = 0): Promise<boolean> => {
    const client = this.createClient(accessToken);

    try {
      await this.withRetry(() => client.play({ uris: [`spotify:track:${trackId}`] }));

      for (let attempt = 0; attempt < 3; attempt++) {
        await sleep(1000 * 2 ** attempt);
        const { body } = await client.getMyCurrentPlaybackState();
        if (body.is_playing && body.item?.id === trackId) return true;
      }

      return false;
    } catch (e: unknown) {
      if (trial > MAX_RETRIES) throw new UnableToPlayTrack("Could not play track");

      const { reason } = parseSpotifyError(e);
      if (reason === "NO_ACTIVE_DEVICE") {
        console.warn("No active device found, trying to transfer playback");
        const { body } = await client.getMyDevices();
        const firstDevice = body.devices[0];
        if (!firstDevice?.id) throw new UnableToPlayTrack("No playback device(s) found");
        await client.transferMyPlayback([firstDevice.id]);
        await sleep(1500);
        return this.playTrack(accessToken, trackId, trial + 1);
      }

      return false;
    }
  };

  getRecommendedTracks = async (accessToken: string, seedTrackIds: string[]) => {
    const client = this.createClient(accessToken);
    const me = await this.withRetry(() => client.getMe());
    const { body } = await this.withRetry(() =>
      client.getRecommendations({
        seed_tracks: seedTrackIds.slice(0, Math.min(5, seedTrackIds.length)),
        market: me.body.country,
        limit: 5,
      }),
    );
    return body.tracks;
  };

  pause = async (accessToken: string): Promise<void> => {
    try {
      await this.withRetry(() => this.createClient(accessToken).pause());
    } catch (e: unknown) {
      if (!isHardFailure(e)) {
        console.warn("Failed to pause after retries", parseSpotifyError(e));
      }
    }
  };
}
