import { z } from "zod";

import { AuthService } from "../service/authService";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const getAccessTokenSchema = z.object({
  code: z.string(),
  redirectUri: z.string().url(),
});

export const refreshAccessTokenSchema = z.object({
  refreshToken: z.string(),
});

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
      return service.getAccessToken(input);
    }),
  refreshToken: protectedProcedure
    .input(refreshAccessTokenSchema)
    .query(() => {}),
});
