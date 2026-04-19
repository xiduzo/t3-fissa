import type { InferSelectModel, accounts, sessions, users } from "@fissa/db";
import type { ISpotifyService } from "./ISpotifyService";

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type Account = InferSelectModel<typeof accounts>;

export type UserWithSessions = User & {
  sessions: Pick<Session, "token" | "expiresAt">[];
};

export type UserWithFissas = {
  hostOf: { pin: string } | null;
  isIn: { pin: string }[];
};

export type UserWithBadges = Pick<User, "createdAt"> & {
  badges: {
    userId: string;
    name: string;
    score: number;
    lastUpdated: Date;
  }[];
};

export type FissaOwnerRefreshData = {
  lastUpdateAt: Date;
  accessTokenExpiresAt: Date | null;
  refreshToken: string | null;
};

export interface IUserRepository {
  findByEmail(email: string): Promise<UserWithSessions | undefined>;

  findByIdWithBadges(userId: string): Promise<UserWithBadges | undefined>;

  findByIdWithFissas(userId: string): Promise<UserWithFissas | undefined>;

  updateImage(userId: string, imageUrl: string | undefined): Promise<void>;

  updateSessionExpiry(token: string, expiresAt: Date): Promise<Session | undefined>;

  updateSpotifyAccount(
    accountId: string,
    accessToken: string,
    accessTokenExpiresAt: Date,
  ): Promise<void>;

  findFissaOwnerRefreshData(pin: string): Promise<FissaOwnerRefreshData | undefined>;

  getSpotifyAccessToken(userId: string): Promise<string | null>;

  createUserWithAccount(
    spotifyUser: SpotifyApi.CurrentUsersProfileResponse,
    tokens: Awaited<ReturnType<ISpotifyService["codeGrant"]>>,
  ): Promise<void>;
}
