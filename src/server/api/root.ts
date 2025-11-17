import { router } from '../trpc';
import { guestRouter } from '../routers/guest';
import { routineRouter } from '../routers/routine';
import { subscriptionRouter } from '../routers/subscription';

export const appRouter = router({
  guest: guestRouter,
  routine: routineRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;

