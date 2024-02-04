import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { createContext } from "./utils/context";

/**
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = createContext;

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });

  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

const enforceIsTrustedServer = t.middleware(({ next, ctx }) => {
  // TODO: add check for trusted server -> vercel cron job
  console.info("headers", ctx.headers);

  return next();
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const serviceProcedure = t.procedure.use(enforceIsTrustedServer);
