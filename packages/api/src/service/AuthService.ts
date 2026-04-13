import {
  addMonths,
  addSeconds,
  differenceInMinutes,
  isPast,
} from "@fissa/utils";
import type { Session } from "@fissa/auth";

import type { ISpotifyService, IUserRepository } from "../interfaces";

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly spotifyService: ISpotifyService,
    private readonly session: Session | null,
  ) {}

  getUserFissa = async () => {
    if (!this.session?.user.id) throw new Error("User not found");
    const user = await this.userRepo.findByIdWithFissas(this.session.user.id);
    if (!user) throw new Error("User not found");
    return user;
  };

  getUserStats = async (userId: string) => {
    const user = await this.userRepo.findByIdWithBadges(userId);
    if (!user) throw new Error("User not found");
    return user;
  };

  getAccessToken = async (code: string, redirectUri: string) => {
    const tokens = await this.spotifyService.codeGrant(code, redirectUri);
    const spotifyUser = await this.spotifyService.me(tokens.body.access_token);

    let user = await this.userRepo.findByEmail(spotifyUser.body.email ?? "");

    if (!user) {
      await this.userRepo.createUserWithAccount(spotifyUser.body, tokens);
      user = await this.userRepo.findByEmail(spotifyUser.body.email ?? "");
      if (!user) throw new Error("Failed to create user");
    }

    return {
      ...tokens.body,
      session_token: user.sessions[0]?.token,
    };
  };

  refreshToken = async (refreshToken: string) => {
    const tokens = await this.spotifyService.refresh(refreshToken);
    const spotifyUser = await this.spotifyService.me(tokens.body.access_token);

    const user = await this.userRepo.findByEmail(spotifyUser.body.email ?? "");
    if (!user) throw new Error("User not found");

    let session = user.sessions[0];

    if (session && isPast(session.expiresAt)) {
      const updated = await this.userRepo.updateSessionExpiry(
        session.token,
        addMonths(new Date(), 1),
      );
      session = updated ?? session;
    }

    await this.userRepo.updateSpotifyAccount(
      spotifyUser.body.id,
      tokens.body.access_token,
      addSeconds(new Date(), tokens.body.expires_in),
    );

    await this.userRepo.updateImage(user.id, spotifyUser.body.images?.[0]?.url);

    return {
      ...tokens.body,
      session_token: session?.token,
    };
  };

  refreshFissaAccessToken = async (pin: string) => {
    const data = await this.userRepo.findFissaOwnerRefreshData(pin);
    if (!data) return;

    const { lastUpdateAt, accessTokenExpiresAt, refreshToken } = data;
    if (differenceInMinutes(lastUpdateAt, new Date()) > 20) return;
    if (!refreshToken) return;

    if (differenceInMinutes(accessTokenExpiresAt ?? new Date(), new Date()) >= 20) return;

    return this.refreshToken(refreshToken);
  };
}

