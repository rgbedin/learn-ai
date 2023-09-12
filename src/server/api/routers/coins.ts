/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

const INITIAL_COINS = 5;

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

    return coins.coins;
  }),
});
