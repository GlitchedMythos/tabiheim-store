// apps/api/src/lib/auth.ts
import { neon } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import type { Bindings } from './bindings';

export type AuthContext = ReturnType<typeof betterAuth>;

export function initAuth(env: Bindings) {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.WEB_URL],
  });
}

// Then in your main app (index.ts):
// app.use('*', async (c, next) => {
//   c.set('auth', initAuth(c.env));
//   await next();
// });
