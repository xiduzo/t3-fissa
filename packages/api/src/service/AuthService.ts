import { accounts, sessions, users, usersInFissas } from "@fissa/db";
import {
  addMonths,
  addSeconds,
  differenceInMinutes,
  isPast,
  type SpotifyService,
} from "@fissa/utils";
import { and, desc, eq } from "drizzle-orm";

import { ServiceWithContext, type Context } from "../utils/context";

export class AuthService extends ServiceWithContext {
  constructor(ctx: Context, private readonly spotifyService: SpotifyService) {
    super(ctx);
  }

  getUserFissa = async () => {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, this.session?.user.id ?? ""),
      columns: {},
      with: {
        hostOf: { columns: { pin: true } },
        isIn: {
          columns: { pin: true },
          orderBy: [desc(usersInFissas.createdAt)],
        },
      },
    });

    if (!user) throw new Error("User not found");
    return user;
  };

  getUserStats = async (userId: string) => {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { createdAt: true },
      with: { badges: true },
    });

    if (!user) throw new Error("User not found");
    return user;
  };

  getAccessToken = async (code: string, redirectUri: string) => {
    const tokens = await this.spotifyService.codeGrant(code, redirectUri);
    const spotifyUser = await this.spotifyService.me(tokens.body.access_token);

    let user = await this.db.query.users.findFirst({
      where: eq(users.email, spotifyUser.body.email ?? ""),
      columns: { id: true, email: true },
      with: {
        sessions: {
          columns: { token: true, expiresAt: true },
          orderBy: [desc(sessions.expiresAt)],
          limit: 1,
        },
      },
    });

    if (!user) {
      await this.createAccount(spotifyUser.body, tokens);
      const created = await this.db.query.users.findFirst({
        where: eq(users.email, spotifyUser.body.email ?? ""),
        columns: { id: true, email: true },
        with: {
          sessions: {
            columns: { token: true, expiresAt: true },
            orderBy: [desc(sessions.expiresAt)],
            limit: 1,
          },
        },
      });
      if (!created) throw new Error("Failed to create user");
      user = created;
    }

    return {
      ...tokens.body,
      session_token: user.sessions[0]?.token,
    };
  };

  refreshToken = async (refreshToken: string) => {
    const tokens = await this.spotifyService.refresh(refreshToken);
    const spotifyUser = await this.spotifyService.me(tokens.body.access_token);

    const user = await this.db.query.users.findFirst({
      where: eq(users.email, spotifyUser.body.email ?? ""),
      columns: { id: true },
      with: {
        sessions: {
          columns: { token: true, expiresAt: true },
          orderBy: [desc(sessions.expiresAt)],
          limit: 1,
        },
      },
    });

    if (!user) throw new Error("User not found");

    let session = user.sessions[0];

    if (session && isPast(session.expiresAt)) {
      const [updated] = await this.db
        .update(sessions)
        .set({ expiresAt: addMonths(new Date(), 1) })
        .where(eq(sessions.token, session.token))
        .returning();
      session = updated;
    }

    await this.db
      .update(accounts)
      .set({
        accessToken: tokens.body.access_token,
        accessTokenExpiresAt: addSeconds(new Date(), tokens.body.expires_in),
      })
      .where(
        and(
          eq(accounts.providerId, "spotify"),
          eq(accounts.accountId, spotifyUser.body.id),
        ),
      );

    await this.db
      .update(users)
      .set({ image: spotifyUser.body.images?.[0]?.url })
      .where(eq(users.id, user.id));

    return {
      ...tokens.body,
      session_token: session?.token,
    };
  };

  refreshFissaAccessToken = async (pin: string) => {
    const fissa = await this.db.query.fissas.findFirst({
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

    if (!fissa) return;
    if (differenceInMinutes(fissa.lastUpdateAt, new Date()) > 20) return;
    if (!fissa.by.accounts[0]) return;

    const { accessTokenExpiresAt, refreshToken } = fissa.by.accounts[0];
    if (!refreshToken) return;

    if (differenceInMinutes(accessTokenExpiresAt ?? new Date(), new Date()) >= 20) return;

    return this.refreshToken(refreshToken);
  };

  private createAccount = async (
    spotifyUser: SpotifyApi.CurrentUsersProfileResponse,
    tokens: Awaited<ReturnType<SpotifyService["codeGrant"]>>,
  ) => {
    return this.db.transaction(async (tx) => {
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

