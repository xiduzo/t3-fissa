import { Prisma } from "@fissa/db";
import {
  addMonths,
  addSeconds,
  differenceInMinutes,
  isPast,
  type SpotifyService,
} from "@fissa/utils";

import { ServiceWithContext, type Context } from "../utils/context";

export class AuthService extends ServiceWithContext {
  constructor(ctx: Context, private readonly spotifyService: SpotifyService) {
    super(ctx);
  }

  getUserFissa = async () => {
    return this.db.user.findUniqueOrThrow({
      where: { id: this.session?.user.id },
      select: {
        hostOf: { select: { pin: true } },
        isIn: { select: { pin: true }, orderBy: { createdAt: Prisma.SortOrder.desc } },
      },
    });
  };

  getUserStats = async (userId: string) => {
    return this.db.user.findFirstOrThrow({
      where: { id: userId },
      select: {
        badges: true,
        createdAt: true
      }
    })
  }

  getAccessToken = async (code: string, redirectUri: string) => {
    const tokens = await this.spotifyService.codeGrant(code, redirectUri);

    const spotifyUser = await this.spotifyService.me(tokens.body.access_token);

    const findUser = {
      where: { email: spotifyUser.body.email },
      include: {
        sessions: { take: 1, orderBy: { expires: Prisma.SortOrder.desc } },
      },
    };

    let user = await this.db.user.findUnique(findUser);

    if (!user) {
      await this.createAccount(spotifyUser.body, tokens);
      user = await this.db.user.findUniqueOrThrow(findUser);
    }

    return {
      ...tokens.body,
      session_token: user?.sessions[0]?.sessionToken,
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
        data: {
          expires: addMonths(new Date(), 1),
        },
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
        user: {
          update: { image: spotifyUser.body.images?.[0]?.url },
        }
      },
    });

    return {
      ...tokens.body,
      session_token: session?.sessionToken,
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

    if (differenceInMinutes(fissa.lastUpdateAt, new Date()) > 20) return;

    if (!fissa.by.accounts[0]) return;
    const { expires_at, refresh_token } = fissa.by.accounts[0];

    if (!refresh_token) return;

    // Token is still valid
    if (differenceInMinutes(expires_at ?? new Date(), new Date()) >= 20) return;

    return this.refreshToken(refresh_token);
  };

  private createAccount = async (
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
            image: spotifyUser.images?.[0]?.url,
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
