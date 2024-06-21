import { SpotifyService } from "@fissa/utils";
import { z } from "zod";

import { AuthService } from "../service/AuthService";
import { createTRPCRouter, protectedProcedure, publicProcedure, serviceProcedure } from "../trpc";
import { Z_PIN } from "./constants";

export const getAccessTokenSchema = z.object({
  code: z.string(),
  redirectUri: z.string().url(),
});

const sync = createTRPCRouter({
  refreshToken: serviceProcedure.input(Z_PIN).mutation(({ ctx, input }) => {
    const service = new AuthService(ctx, new SpotifyService());
    return service.refreshFissaAccessToken(input);
  }),
});

export const authRouter = createTRPCRouter({
  getUserFissa: protectedProcedure.query(({ ctx }) => {
    const service = new AuthService(ctx, new SpotifyService());
    return service.getUserFissa();
  }),
  getTokensFromCode: publicProcedure.input(getAccessTokenSchema).mutation(({ ctx, input }) => {
    const service = new AuthService(ctx, new SpotifyService());
    return service.getAccessToken(input.code, input.redirectUri);
  }),
  refreshToken: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    const service = new AuthService(ctx, new SpotifyService());
    return service.refreshToken(input);
  }),
  getUserStats: protectedProcedure.query(({ ctx }) => {
    const service = new AuthService(ctx, new SpotifyService());
    return service.getUserStats(ctx.session.user.id);
  }),
  sync,
});
