/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Stripe } from "stripe";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { type PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";
import { COINS_PER_BUNDLE } from "~/utils/constants";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export const getOrCreateStripeCustomerIdForUser = async ({
  stripe,
  prisma,
  userId,
}: {
  stripe: Stripe;
  prisma: PrismaClient;
  userId: string;
}) => {
  const user = await clerkClient.users.getUser(userId);

  const ourUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!ourUser) throw new Error("User not found");

  if (ourUser.stripeCustomerId) {
    return ourUser.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.emailAddresses?.[0]?.emailAddress ?? undefined,
    name: `${user.firstName} ${user.lastName}` ?? undefined,
    metadata: {
      userId: user.id,
    },
  });

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  return updatedUser.stripeCustomerId!;
};

export const handleInvoicePaid = async ({
  event,
  stripe,
  prisma,
}: {
  event: Stripe.Event;
  stripe: Stripe;
  prisma: PrismaClient;
}) => {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription;
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId as string,
  );
  const userId = subscription.metadata.userId;

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      stripeSubscriptionPaidUntil: subscription.status.includes("incomplete")
        ? undefined
        : new Date(subscription.current_period_end * 1000),
    },
  });
};

export const handleStripeCheckoutSessionCompleted = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;

  const lineItemsResp = await stripe.checkout.sessions.listLineItems(
    session.id,
  );

  const lineItems = lineItemsResp.data;

  for (const li of lineItems) {
    const product = li.price?.product as Stripe.Product;

    if (product.id === process.env.STRIPE_COIN_PRODUCT_ID) {
      const quantity = li.quantity ?? 1;

      await prisma.coins.update({
        where: {
          userId: userId!,
        },
        data: {
          coins: {
            increment: quantity * COINS_PER_BUNDLE,
          },
        },
      });
    } else {
      console.warn("Unknown product", product);
    }
  }
};

export const handleSubscriptionUpdated = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata.userId;

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      stripeSubscriptionPaidUntil: subscription.status.includes("incomplete")
        ? undefined
        : new Date(subscription.current_period_end * 1000),
    },
  });
};

export const stripeRouter = createTRPCRouter({
  getProductPrice: privateProcedure
    .input(
      z.object({
        product: z.enum(["SUBS_MONTHLY", "SUBS_YEARLY", "COIN"]),
      }),
    )
    .query(async ({ input }) => {
      const prices = await stripe.prices.list({
        active: true,
      });

      const thePrice = prices.data.find((price) => {
        if (price.recurring?.interval === "month") {
          return input.product === "SUBS_MONTHLY";
        } else if (price.recurring?.interval === "year") {
          return input.product === "SUBS_YEARLY";
        } else if (price.product === process.env.STRIPE_COIN_PRODUCT_ID) {
          return input.product === "COIN";
        }
      });

      if (!thePrice) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No price found",
        });
      }

      return thePrice.unit_amount;
    }),

  generateCheckoutUrl: privateProcedure
    .input(
      z.object({
        product: z.enum(["SUBS_MONTHLY", "SUBS_YEARLY", "COIN"]),
        amount: z.number().optional(),
        origin: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const customerId = await getOrCreateStripeCustomerIdForUser({
        prisma: ctx.prisma,
        stripe,
        userId: ctx.userId,
      });

      if (input.product === "COIN") {
        const prices = await stripe.prices.list({
          product: process.env.STRIPE_COIN_PRODUCT_ID!,
          expand: ["data.product"],
        });

        const thePrice = prices.data.find((price) => {
          return price.active;
        });

        if (!thePrice) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No price found",
          });
        }

        const params: Stripe.Checkout.SessionCreateParams = {
          payment_intent_data: { metadata: { userId: ctx.userId } },
          billing_address_collection: "auto",
          mode: "payment",
          line_items: [
            {
              price: thePrice.id,
              quantity: input.amount ?? 1,
            },
          ],
          metadata: { userId: ctx.userId },
          allow_promotion_codes: true,
          customer: customerId,
          success_url: input.origin,
          cancel_url: input.origin,
        };

        const session = await stripe.checkout.sessions.create(params);

        return session;
      } else {
        const prices = await stripe.prices.list({
          product: process.env.STRIPE_SUBSCRIPTION_PRODUCT_ID!,
          expand: ["data.product"],
        });

        const thePrice = prices.data.find((price) => {
          if (input.product === "SUBS_MONTHLY") {
            return price.recurring?.interval === "month" && price.active;
          } else if (input.product === "SUBS_YEARLY") {
            return price.recurring?.interval === "year" && price.active;
          }
        });

        if (!thePrice) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No price found",
          });
        }

        const params: Stripe.Checkout.SessionCreateParams = {
          subscription_data: { metadata: { userId: ctx.userId } },
          billing_address_collection: "auto",
          mode: "subscription",
          line_items: [
            {
              price: thePrice.id,
              quantity: 1,
            },
          ],
          metadata: { userId: ctx.userId },
          allow_promotion_codes: true,
          customer: customerId,
          success_url: input.origin,
          cancel_url: input.origin,
        };

        const session = await stripe.checkout.sessions.create(params);

        return session;
      }
    }),

  generateBillingPortalUrl: privateProcedure
    .input(
      z.object({
        origin: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const customerId = await getOrCreateStripeCustomerIdForUser({
        prisma: ctx.prisma,
        stripe,
        userId: ctx.userId,
      });

      const stripeBillingPortalSession =
        await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: input.origin,
        });

      if (!stripeBillingPortalSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No billing portal session found",
        });
      }

      return { billingPortalUrl: stripeBillingPortalSession.url };
    }),
});
