import { z } from "zod";
import { Session, User } from "@fissa/db";
import { addMonths, addSeconds } from "@fissa/utils";

import { getAccessTokenSchema } from "../router/auth";
import { ServiceWithContext } from "../utils/context";
import { SpotifyService } from "./SpotifyService";

export class AuthService extends ServiceWithContext {
  getAccessToken = async (input: z.infer<typeof getAccessTokenSchema>) => {
    const { code, redirectUri } = input;

    const service = new SpotifyService();
    const tokens = await service.codeGrant(code, redirectUri);

    const spotifyUser = await service.me(tokens.body.access_token);

    const existingUser = await this.db.user.findUnique({
      where: { email: spotifyUser.body.email },
    });

    if (!existingUser) {
      await this.createUser(spotifyUser.body, tokens);
    }

    return tokens;
  };

  refreshToken = async (refreshToken: string) => {
    const service = new SpotifyService();
    return service.refresh(refreshToken);
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
        expires_at: Math.round(
          // We need the time in seconds, not in milliseconds
          addSeconds(new Date(), tokens.body.expires_in).getTime() / 1000,
        ),
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
}
