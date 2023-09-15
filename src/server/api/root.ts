import { createTRPCRouter } from "~/server/api/trpc";
import { fileRouter } from "./routers/file";
import { coinsRouter } from "./routers/coins";
import { stripeRouter } from "./routers/stripe";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  file: fileRouter,
  coins: coinsRouter,
  stripe: stripeRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
