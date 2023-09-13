/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

export const userRouter = createTRPCRouter({
  getSubscriptionStatus: privateProcedure.query(async ({ ctx }) => {
    let user = await prisma.user.findUnique({
      where: {
        id: ctx.userId,
      },
      select: {
        stripeSubscriptionStatus: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: ctx.userId,
        },
      });
    }

    return user.stripeSubscriptionStatus;
  }),
});
