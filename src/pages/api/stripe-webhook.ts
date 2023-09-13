import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "~/server/db";
import type Stripe from "stripe";
import { buffer } from "micro";
import {
  handleInvoicePaid,
  handleSubscriptionUpdated,
  stripe,
} from "~/server/api/routers/stripe";

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.debug("stripe-webhook.ts handler", req.method);

  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig as string, webhookSecret);

      switch (event.type) {
        case "invoice.paid":
          await handleInvoicePaid({
            event,
            stripe,
            prisma,
          });
          break;
        case "customer.subscription.created":
          await handleSubscriptionUpdated({
            event,
            prisma,
          });
          break;
        case "customer.subscription.updated":
          // Used to provision services as they are updated.
          await handleSubscriptionUpdated({
            event,
            prisma,
          });
          break;
        case "invoice.payment_failed":
          // If the payment fails or the customer does not have a valid payment method,
          // an invoice.payment_failed event is sent, the subscription becomes past_due.
          // Use this webhook to notify your user that their payment has
          // failed and to retrieve new card details.
          // Can also have Stripe send an email to the customer notifying them of the failure. See settings: https://dashboard.stripe.com/settings/billing/automatic
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionUpdated({
            event,
            prisma,
          });
          break;
        default:
        // Unexpected event type
      }

      res.json({ received: true });
    } catch (err) {
      res.status(400).send(err);
      return;
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
