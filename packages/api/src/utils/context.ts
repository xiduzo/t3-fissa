import { getSession, type Session } from "@fissa/auth";
import { db, type DB } from "@fissa/db";
import { type inferAsyncReturnType } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export type CreateContextOptions = {
  session: Session | null;
  headers?: Headers;
};

export const createContextInner = async (opts: CreateContextOptions) => {
  return Promise.resolve({
    ...opts,
    database: db,
  });
};

export const createContext = async (opts?: FetchCreateContextFnOptions) => {
  const session = opts ? await getSession(opts.req) : null;

  return createContextInner({
    session,
    headers: opts?.req.headers,
  });
};

export type Context = inferAsyncReturnType<typeof createContext>;
