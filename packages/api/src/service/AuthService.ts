import { Prisma } from "@fissa/db";
import { SpotifyService, addMonths, addSeconds, differenceInMinutes, isPast } from "@fissa/utils";

import { Context, ServiceWithContext } from "../utils/context";

export class AuthService extends ServiceWithContext {
  private spotifyService: SpotifyService = new SpotifyService();

  constructor(ctx: Context, spotifyService?: SpotifyService) {
    super(ctx);

    this.spotifyService = spotifyService ?? new SpotifyService();
  }

  getUserFissa = async () => {
    const { hostOf, partOf } = await this.db.user.findUniqueOrThrow({
      where: { id: this.ctx.session?.user.id },
      select: {
        hostOf: { select: { pin: true } },
        partOf: {
          select: { pin: true },
          orderBy: { createdAt: Prisma.SortOrder.desc },
        },
      },
    });

    return {
      hostOf,
      partOf,
    };
  };

  getAccessToken = async (code: string, redirectUri: string) => {
    const tokens = await this.spotifyService.codeGrant(code, redirectUri);

    const spotifyUser = await this.spotifyService.me(tokens.body.access_token);

    const findUser = {
      where: { email: spotifyUser.body.email },
      include: {
        sessions: { take: 1, orderBy: { expires: Prisma.SortOrder.desc } },
      },
    };

    let existingUser = await this.db.user.findUnique(findUser);

    if (!existingUser) {
      await this.createUser(spotifyUser.body, tokens);
      existingUser = await this.db.user.findUniqueOrThrow(findUser);
    }

    return {
      ...tokens.body,
      session_token: existingUser.sessions[0]?.sessionToken!,
    };
  };

  refreshToken = async (refreshToken: string) => {
    const tokens = await this.spotifyService.refresh(refreshToken);
    const spotifyUser = await this.spotifyService.me(tokens.body.access_token);

    const { sessions } = await this.db.user.findUniqueOrThrow({
      where: { email: spotifyUser.body.email },
      select: { sessions: { take: 1, orderBy: { expires: "desc" } } },
    });

    let session = sessions[0];

    if (session && isPast(session.expires)) {
      session = await this.db.session.update({
        where: { id: session.id },
        data: { expires: addMonths(new Date(), 1) },
      });
    }

    await this.db.account.update({
      where: {
        provider_providerAccountId: {
          provider: "spotify",
          providerAccountId: spotifyUser.body.id,
        },
      },
      data: {
        access_token: tokens.body.access_token,
        expires_at: this.expiresAt(tokens.body.expires_in),
      },
    });

    return {
      ...tokens.body,
      session_token: session?.sessionToken!,
    };
  };

  refreshFissaAccessToken = async (pin: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: {
        lastUpdateAt: true,
        by: {
          select: {
            accounts: {
              select: { expires_at: true, refresh_token: true },
              take: 1,
            },
          },
        },
      },
    });

    const { lastUpdateAt } = fissa;

    if (differenceInMinutes(lastUpdateAt, new Date()) > 20) return;

    const { accounts } = fissa.by;
    const { expires_at, refresh_token } = accounts[0]!;

    // Token is still valid
    if (differenceInMinutes(expires_at!, new Date()) >= 20) return;

    return this.refreshToken(refresh_token!);
  };

  private createUser = async (
    spotifyUser: SpotifyApi.CurrentUsersProfileResponse,
    tokens: Awaited<ReturnType<SpotifyService["codeGrant"]>>,
  ) => {
    return this.db.account.create({
      data: {
        provider: "spotify",
        providerAccountId: spotifyUser.id,
        type: "oauth",
        access_token: tokens.body.access_token,
        refresh_token: tokens.body.refresh_token,
        expires_at: this.expiresAt(tokens.body.expires_in),
        token_type: "Bearer",
        scope: tokens.body.scope,
        user: {
          create: {
            email: spotifyUser.email,
            name: spotifyUser.display_name,
            sessions: {
              create: {
                expires: addMonths(new Date(), 1),
              },
            },
          },
        },
      },
    });
  };

  private expiresAt = (expiresIn: number) =>
    Math.round(addSeconds(new Date(), expiresIn).getTime() / 1000);
}
