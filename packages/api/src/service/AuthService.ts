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
          columns: { sessionToken: true, expires: true },
          orderBy: [desc(sessions.expires)],
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
            columns: { sessionToken: true, expires: true },
            orderBy: [desc(sessions.expires)],
            limit: 1,
          },
        },
      });
      if (!created) throw new Error("Failed to create user");
      user = created;
    }

    return {
      ...tokens.body,
      session_token: user.sessions[0]?.sessionToken,
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
          columns: { sessionToken: true, expires: true },
          orderBy: [desc(sessions.expires)],
          limit: 1,
        },
      },
    });

    if (!user) throw new Error("User not found");

    let session = user.sessions[0];

    if (session && isPast(session.expires)) {
      const [updated] = await this.db
        .update(sessions)
        .set({ expires: addMonths(new Date(), 1) })
        .where(eq(sessions.sessionToken, session.sessionToken))
        .returning();
      session = updated;
    }

    await this.db
      .update(accounts)
      .set({
        access_token: tokens.body.access_token,
        expires_at: this.expiresAt(tokens.body.expires_in),
      })
      .where(
        and(
          eq(accounts.provider, "spotify"),
          eq(accounts.providerAccountId, spotifyUser.body.id),
        ),
      );

    await this.db
      .update(users)
      .set({ image: spotifyUser.body.images?.[0]?.url })
      .where(eq(users.id, user.id));

    return {
      ...tokens.body,
      session_token: session?.sessionToken,
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
              columns: { expires_at: true, refresh_token: true },
              limit: 1,
            },
          },
        },
      },
    });

    if (!fissa) return;
    if (differenceInMinutes(fissa.lastUpdateAt, new Date()) > 20) return;
    if (!fissa.by.accounts[0]) return;

    const { expires_at, refresh_token } = fissa.by.accounts[0];
    if (!refresh_token) return;

    if (differenceInMinutes(expires_at ? new Date(expires_at * 1000) : new Date(), new Date()) >= 20) return;

    return this.refreshToken(refresh_token);
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
        })
        .returning();

      if (!user) throw new Error("Failed to create user");

      await tx.insert(sessions).values({
        userId: user.id,
        sessionToken: crypto.randomUUID(),
        expires: addMonths(new Date(), 1),
      });

      await tx.insert(accounts).values({
        userId: user.id,
        provider: "spotify",
        providerAccountId: spotifyUser.id,
        type: "oauth",
        access_token: tokens.body.access_token,
        refresh_token: tokens.body.refresh_token,
        expires_at: this.expiresAt(tokens.body.expires_in),
        token_type: "Bearer",
        scope: tokens.body.scope,
      });
    });
  };

  private expiresAt = (expiresIn: number) =>
    Math.round(addSeconds(new Date(), expiresIn).getTime() / 1000);
}
