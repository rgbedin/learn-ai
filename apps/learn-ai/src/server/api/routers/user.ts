// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import { prisma } from "database/src/client";
import dayjs from "dayjs";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

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
