import { PrismaClient } from "@prisma/client";
import { type inferAsyncReturnType } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import {
  expoHackServerSession,
  getServerSession,
  type Session,
} from "@fissa/auth";
import { prisma } from "@fissa/db";

/**
 * Replace this with an object if you want to pass things to createContextInner
 */
type CreateContextOptions = {
  session: Session | null;
};

/** Use this helper for:
 *  - testing, where we don't have to Mock Next.js' req/res
 *  - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://beta.create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
export const createContextInner = async (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * This is the actual context you'll use in your router
 * @link https://trpc.io/docs/context
 **/
export const createContext = async (opts?: CreateNextContextOptions) => {
  let session = await (opts ? getServerSession(opts) : null);

  if (!session) {
    session = await expoHackServerSession(opts);
  }

  return await createContextInner({
    session,
  });
};

export type Context = inferAsyncReturnType<typeof createContext>;

export abstract class ServiceWithContext {
  protected db: PrismaClient;

  constructor(protected ctx: Context) {
    this.db = ctx.prisma;
  }
}
