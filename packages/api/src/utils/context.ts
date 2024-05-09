import { getServerSession, type Session } from "@fissa/auth";
import { prisma } from "@fissa/db";
import { type PrismaClient } from "@prisma/client";
import { type inferAsyncReturnType } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";

/**
 * Replace this with an object if you want to pass things to createContextInner
 */
export type CreateContextOptions = {
  session: Session | null;
  headers?: CreateNextContextOptions["req"]["headers"];
};

/** Use this helper for:
 *  - testing, where we don't have to Mock Next.js' req/res
 *  - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://beta.create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
export const createContextInner = async (opts: CreateContextOptions) => {
  return Promise.resolve({
    ...opts,
    database: prisma,
  });
};

/**
 * This is the actual context you'll use in your router
 * @link https://trpc.io/docs/context
 **/
export const createContext = async (opts?: CreateNextContextOptions) => {
  const session = await (opts ? getServerSession(opts) : null);

  return await createContextInner({
    session,
    headers: opts?.req.headers,
  });
};

export type Context = inferAsyncReturnType<typeof createContext>;

export abstract class ServiceWithContext {
  protected db: PrismaClient;
  protected session: Session | null;

  constructor(ctx: Context) {
    this.db = ctx.database;
    this.session = ctx.session;
  }
}
