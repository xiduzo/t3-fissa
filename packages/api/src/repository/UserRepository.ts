import { accounts, sessions, users, usersInFissas, type DB } from "@fissa/db";
import { addMonths, addSeconds } from "@fissa/utils";
import { and, desc, eq } from "drizzle-orm";

import type {
  FissaOwnerRefreshData,
  ISpotifyService,
  IUserRepository,
  Session,
  User,
  UserWithBadges,
  UserWithFissas,
  UserWithSessions,
} from "../interfaces";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: DB) {}

  findByEmail = async (email: string): Promise<UserWithSessions | undefined> => {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, email: true, name: true, image: true, createdAt: true, updatedAt: true, emailVerified: true },
      with: {
        sessions: {
          columns: { token: true, expiresAt: true },
          orderBy: [desc(sessions.expiresAt)],
          limit: 1,
        },
      },
    }) as Promise<UserWithSessions | undefined>;
  };

  findByIdWithBadges = async (userId: string): Promise<UserWithBadges | undefined> => {
    return this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { createdAt: true },
      with: { badges: true },
    }) as Promise<UserWithBadges | undefined>;
  };

  findByIdWithFissas = async (userId: string): Promise<UserWithFissas | undefined> => {
    return this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {},
      with: {
        hostOf: { columns: { pin: true } },
        isIn: {
          columns: { pin: true },
          orderBy: [desc(usersInFissas.createdAt)],
        },
      },
    }) as Promise<UserWithFissas | undefined>;
  };

  updateImage = async (userId: string, imageUrl: string | undefined): Promise<void> => {
    await this.db.update(users).set({ image: imageUrl }).where(eq(users.id, userId));
  };

  updateSessionExpiry = async (token: string, expiresAt: Date): Promise<Session | undefined> => {
    const [updated] = await this.db
      .update(sessions)
      .set({ expiresAt })
      .where(eq(sessions.token, token))
      .returning();
    return updated;
  };

  updateSpotifyAccount = async (
    accountId: string,
    accessToken: string,
    accessTokenExpiresAt: Date,
  ): Promise<void> => {
    await this.db
      .update(accounts)
      .set({ accessToken, accessTokenExpiresAt })
      .where(and(eq(accounts.providerId, "spotify"), eq(accounts.accountId, accountId)));
  };

  findFissaOwnerRefreshData = async (pin: string): Promise<FissaOwnerRefreshData | undefined> => {
    const data = await this.db.query.fissas.findFirst({
      where: (f, { eq }) => eq(f.pin, pin),
      columns: { lastUpdateAt: true },
      with: {
        by: {
          columns: {},
          with: {
            accounts: {
              columns: { accessTokenExpiresAt: true, refreshToken: true },
              limit: 1,
            },
          },
        },
      },
    });

    const account = data?.by.accounts[0];
    if (!data || !account) return undefined;

    return {
      lastUpdateAt: data.lastUpdateAt,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      refreshToken: account.refreshToken,
    };
  };

  createUserWithAccount = async (
    spotifyUser: SpotifyApi.CurrentUsersProfileResponse,
    tokens: Awaited<ReturnType<ISpotifyService["codeGrant"]>>,
  ): Promise<void> => {
    await this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: spotifyUser.email,
          name: spotifyUser.display_name,
          image: spotifyUser.images?.[0]?.url,
          emailVerified: true,
        })
        .returning();

      if (!user) throw new Error("Failed to create user");

      await tx.insert(sessions).values({
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt: addMonths(new Date(), 1),
      });

      await tx.insert(accounts).values({
        userId: user.id,
        providerId: "spotify",
        accountId: spotifyUser.id,
        accessToken: tokens.body.access_token,
        refreshToken: tokens.body.refresh_token,
        accessTokenExpiresAt: addSeconds(new Date(), tokens.body.expires_in),
        scope: tokens.body.scope,
      });
    });
  };
}
