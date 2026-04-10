import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { AuthConfig } from "@auth/core/types";
import Spotify from "@auth/core/providers/spotify";
import { db, accounts, sessions, users, verificationTokens } from "@fissa/db";

export const authConfig: AuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
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
