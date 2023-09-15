/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import { getUserSubscriptionStatus } from "./user";
import { COINS_PER_MONTH, INITIAL_COINS } from "~/utils/constants";

export const ensureUserHasCoins = async (userId: string, amount: number) => {
  const coins = await prisma.coins.findUnique({
    where: {
      userId,
    },
  });

  if (!coins) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "User has no coins",
    });
  }

  if (coins.coins < amount) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User does not have enough coins",
    });
  }
};

export const deductCoins = async (userId: string, amount: number) => {
  await prisma.coins.update({
    where: {
      userId,
    },
    data: {
      coins: {
        decrement: amount,
      },
    },
  });
};

export const giveMonthlyRefillIfNeeded = async (
  userId: string,
  bypassSubscriptionCheck = false,
) => {
  return await prisma.$transaction(async (tx) => {
    let coins = await tx.coins.findUnique({
      where: {
        userId,
      },
    });

    if (!coins) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User has no coins",
      });
    }

    const { isValid } = await getUserSubscriptionStatus(userId);

    if (
      (isValid ?? bypassSubscriptionCheck) && // If subscription is valid or we're bypassing the check
      coins &&
      (!coins.lastMonthlyRefill || // If user has never had a refill
        Math.abs(dayjs(coins.lastMonthlyRefill).diff(new Date(), "month")) >= 1) // If user has had a refill more than a month ago
    ) {
      coins = await tx.coins.update({
        where: {
          userId,
        },
        data: {
          coins: {
            increment: COINS_PER_MONTH,
          },
          lastMonthlyRefill: new Date(),
        },
      });
    }

    return coins;
  });
};

export const coinsRouter = createTRPCRouter({
  getMyCoins: privateProcedure.query(async ({ ctx }) => {
    let coins = await ctx.prisma.coins.findUnique({
      where: {
        userId: ctx.userId,
      },
    });

    if (!coins) {
      coins = await ctx.prisma.coins.create({
        data: {
          userId: ctx.userId,
          coins: INITIAL_COINS,
        },
      });
    }

    coins = await giveMonthlyRefillIfNeeded(ctx.userId);

    const nextRefill = coins.lastMonthlyRefill
      ? dayjs(coins.lastMonthlyRefill).add(1, "month").toDate()
      : undefined;

    return { coins: coins.coins, nextRefill };
  }),
});
