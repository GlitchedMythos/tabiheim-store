import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initAuth, type AuthContext } from './lib/auth';
import type { Bindings } from './lib/bindings';

type Variables = {
  auth: AuthContext;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware
app.use('/*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.WEB_URL,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Auth initialization middleware
app.use('*', async (c, next) => {
  c.set('auth', initAuth(c.env));
  await next();
});

// Better-Auth routes
app.on(['POST', 'GET'], '/api/auth/**', async (c) => {
  const auth = c.get('auth');
  return auth.handler(c.req.raw);
});

// Your API routes
app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' });
});

export default app;
