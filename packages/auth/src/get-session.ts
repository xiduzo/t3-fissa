import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { getServerSession as $getServerSession } from "next-auth";
import { prisma } from "@fissa/db";

import { authOptions } from "./auth-options";

type GetServerSessionContext =
  | {
      req: GetServerSidePropsContext["req"];
      res: GetServerSidePropsContext["res"];
    }
  | { req: NextApiRequest; res: NextApiResponse };
export const getServerSession = async (ctx: GetServerSessionContext) => {
  let session = await $getServerSession(ctx.req, ctx.res, authOptions);

  if (!session) {
    session = await expoHackServerSession(ctx);
  }

  return session;
};

export const expoHackServerSession = async (ctx?: GetServerSessionContext) => {
  if (!ctx?.req.headers.authorization) return null;

  // Hack for expo session
  const session = await prisma.session.findUnique({
    where: { sessionToken: ctx.req.headers.authorization },
    select: { user: true, expires: true },
  });

  if (!session) return null;

  return {
    ...session,
    expires: session?.expires?.toISOString(),
  };
};
