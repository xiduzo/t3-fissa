import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createContainer } from "../container";
import { InsufficientPoints, NotAMember } from "../domain/Wallet";
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
  spend: protectedProcedure.input(spend).mutation(async ({ ctx, input }) => {
    try {
      return await createContainer(ctx).walletService.spend(
        input.pin,
        ctx.session.user.id,
        input.amount,
      );
    } catch (err) {
      if (err instanceof InsufficientPoints) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient points",
          cause: err,
        });
      }
      if (err instanceof NotAMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this fissa",
          cause: err,
        });
      }
      throw err;
    }
  }),
});
