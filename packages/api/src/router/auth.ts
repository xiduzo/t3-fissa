import { z } from "zod";

import { createContainer } from "../container";
import { createTRPCRouter, protectedProcedure, publicProcedure, serviceProcedure } from "../trpc";
import { Z_PIN } from "./constants";

export const getAccessTokenSchema = z.object({
  code: z.string(),
  redirectUri: z.string().url(),
});

const sync = createTRPCRouter({
  refreshToken: serviceProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    return createContainer(ctx).authService.refreshFissaAccessToken(input);
  }),
});

export const authRouter = createTRPCRouter({
  getUserFissa: protectedProcedure.query(({ ctx }) => {
    return createContainer(ctx).authService.getUserFissa();
  }),
  getTokensFromCode: publicProcedure.input(getAccessTokenSchema).mutation(({ ctx, input }) => {
    return createContainer(ctx).authService.getAccessToken(input.code, input.redirectUri);
  }),
  refreshToken: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return createContainer(ctx).authService.refreshToken(input);
  }),
  getUserStats: protectedProcedure.query(({ ctx }) => {
    return createContainer(ctx).authService.getUserStats(ctx.session.user.id);
  }),
  sync,
});
