import { z } from "zod";

import { AuthService } from "../service/AuthService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const getAccessTokenSchema = z.object({
  code: z.string(),
  redirectUri: z.string().url(),
});

export const refreshAccessTokenSchema = z.string();

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    // testing type validation of overridden next-auth Session in @fissa/auth package
    return "you can see this secret message!";
  }),
  getTokensFromCode: publicProcedure
    .input(getAccessTokenSchema)
    .mutation(({ ctx, input }) => {
      const service = new AuthService(ctx);
      return service.getAccessToken(input.code, input.redirectUri);
    }),
  refreshToken: publicProcedure
    .input(refreshAccessTokenSchema)
    .mutation(({ ctx, input }) => {
      const service = new AuthService(ctx);
      return service.refreshToken(input);
    }),
});
