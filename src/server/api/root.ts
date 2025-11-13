import { router } from '../trpc';
import { guestRouter } from '../routers/guest';
import { routineRouter } from '../routers/routine';

export const appRouter = router({
  guest: guestRouter,
  routine: routineRouter,
});

export type AppRouter = typeof appRouter;

