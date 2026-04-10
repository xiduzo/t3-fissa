export type SpotifyTokenResponse = {
  access_token: string;
  refresh_token?: string | null;
  expires_in: number;
  scope: string;
  token_type?: string;
};

export interface ISpotifyService {
  codeGrant(
    code: string,
    redirectUri: string,
  ): Promise<{ body: SpotifyTokenResponse }>;

  refresh(
    refreshToken: string,
  ): Promise<{ body: SpotifyTokenResponse }>;

  me(
    accessToken: string,
  ): Promise<{ body: SpotifyApi.CurrentUsersProfileResponse }>;

  isStillPlaying(accessToken: string): Promise<boolean>;

  playTrack(accessToken: string, trackId: string): Promise<boolean>;

  getRecommendedTracks(
    accessToken: string,
    seedTrackIds: string[],
  ): Promise<SpotifyApi.TrackObjectSimplified[]>;

  pause(accessToken: string): Promise<void>;
}
