/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import dayjs from "dayjs";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

export const getUserSubscriptionStatus = async (userId: string) => {
  let user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      stripeSubscriptionStatus: true,
      stripeSubscriptionPaidUntil: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
      },
    });
  }

  return {
    status: user.stripeSubscriptionStatus,
    paidUntil: user.stripeSubscriptionPaidUntil,
    isValid:
      !!user.stripeSubscriptionPaidUntil &&
      dayjs(user.stripeSubscriptionPaidUntil).isAfter(new Date()) &&
      user.stripeSubscriptionStatus !== "canceled",
  };
};

export const userRouter = createTRPCRouter({
  getSubscriptionStatus: privateProcedure.query(async ({ ctx }) => {
    return await getUserSubscriptionStatus(ctx.userId);
  }),
});
