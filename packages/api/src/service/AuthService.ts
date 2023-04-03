import { Prisma } from "@fissa/db";
import { SpotifyService, addMonths, addSeconds, isPast } from "@fissa/utils";

import { ServiceWithContext } from "../utils/context";

export class AuthService extends ServiceWithContext {
  getAccessToken = async (code: string, redirectUri: string) => {
    const service = new SpotifyService();
    const tokens = await service.codeGrant(code, redirectUri);

    const spotifyUser = await service.me(tokens.body.access_token);

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
    const service = new SpotifyService();

    const tokens = await service.refresh(refreshToken);
    const spotifyUser = await service.me(tokens.body.access_token);

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
