import { createClient } from '@/lib/supabase/server';

export async function createContext(opts?: { req?: Request }) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Extract origin from request headers for proper redirect URLs
  let origin: string | undefined;
  if (opts?.req) {
    origin = opts.req.headers.get('origin') || undefined;
    // Fallback to x-forwarded-host for production environments behind load balancers
    if (!origin) {
      const forwardedHost = opts.req.headers.get('x-forwarded-host');
      if (forwardedHost) {
        origin = `https://${forwardedHost}`;
      }
    }
  }

  return {
    supabase,
    user,
    origin,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;


