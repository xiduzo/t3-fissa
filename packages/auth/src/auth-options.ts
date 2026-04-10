import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AuthConfig } from "@auth/core/types";
import Spotify from "@auth/core/providers/spotify";
import { prisma } from "@fissa/db";

export const authConfig: AuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "NO_SPOTIFY_CLIENT_ID",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "NO_SPOTIFY_CLIENT_SECRET",
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
