import type { Context, Next } from 'hono';
import { auth } from '../lib/better-auth';

/**
 * Middleware to require authentication for protected routes.
 * Checks for a valid session and sets user/session in context.
 * Returns 401 if no valid session is found.
 */
export const requireAuth = async (c: Context, next: Next) => {
  const env = c.env as CloudflareBindings;
  const authInstance = auth(env);

  const session = await authInstance.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  c.set('session', session.session);
  await next();
};

