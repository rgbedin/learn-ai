/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import dayjs from "dayjs";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

export const userRouter = createTRPCRouter({
  getSubscriptionStatus: privateProcedure.query(async ({ ctx }) => {
    console.info("userRouter.getSubscriptionStatus", ctx.userId);

    let user = await prisma.user.findUnique({
      where: {
        id: ctx.userId,
      },
      select: {
        stripeSubscriptionStatus: true,
        stripeSubscriptionPaidUntil: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: ctx.userId,
        },
      });
    }

    return {
      status: user.stripeSubscriptionStatus,
      paidUntil: user.stripeSubscriptionPaidUntil,
      isValid:
        user.stripeSubscriptionPaidUntil &&
        dayjs(user.stripeSubscriptionPaidUntil).isAfter(new Date()) &&
        user.stripeSubscriptionStatus !== "canceled",
    };
  }),
});
