import { z } from "zod";

import { createContainer } from "../container";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Z_PIN } from "./constants";

const spend = z.object({
  pin: Z_PIN,
  amount: z.number().int().positive(),
});

export const walletRouter = createTRPCRouter({
  balance: protectedProcedure.input(Z_PIN).query(({ ctx, input }) => {
    return createContainer(ctx).walletService.balance(input, ctx.session.user.id);
  }),
  spend: protectedProcedure.input(spend).mutation(({ ctx, input }) => {
    return createContainer(ctx).walletService.spend(input.pin, ctx.session.user.id, input.amount);
  }),
});
