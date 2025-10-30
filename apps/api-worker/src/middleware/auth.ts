/**
 * Authentication Middleware for Hono
 *
 * This module provides middleware functions for protecting routes with authentication.
 * Uses Supabase JWT token verification to authenticate requests.
 *
 * @module middleware/auth
 */

import { Context, Next } from 'hono';
import { getAuthenticatedUser } from '../lib/auth';
import type { Env } from '../types';
import type { User } from '@supabase/supabase-js';

/**
 * Extended context variables that include authenticated user
 * This allows access to c.get('user') in protected routes
 */
export interface AuthVariables {
  user: User;
}

/**
 * Authentication middleware that requires a valid JWT token
 *
 * This middleware:
 * 1. Extracts the JWT token from the Authorization header
 * 2. Verifies the token using Supabase
 * 3. Attaches the user object to the context (accessible via c.get('user'))
 * 4. Allows the request to continue if authenticated
 * 5. Returns 401/403 error if authentication fails
 *
 * Usage:
 * - Apply to routes that require authentication
 * - The authenticated user is available via c.get('user') in the route handler
 *
 * @param c - Hono context object
 * @param next - Next middleware function
 * @returns Promise that resolves when middleware completes
 *
 * @example
 * ```ts
 * import { requireAuth } from './middleware/auth';
 *
 * // Protect a single route
 * app.get('/api/v1/protected/data', requireAuth, async (c) => {
 *   const user = c.get('user');
 *   return c.json({
 *     message: 'This is protected data',
 *     user: { id: user.id, email: user.email },
 *   });
 * });
 *
 * // Protect multiple routes using app.use()
 * app.use('/api/v1/protected/*', requireAuth);
 *
 * app.get('/api/v1/protected/profile', async (c) => {
 *   const user = c.get('user');
 *   return c.json({ profile: user });
 * });
 * ```
 *
 * @remarks
 * - Returns 401 if no token is provided or token is invalid
 * - Returns 403 if token is valid but user is not found
 * - Sets the user in context for downstream handlers
 * - Works with Cloudflare Workers environment
 */
export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next
): Promise<Response | void> {
  // Get the Authorization header
  const authHeader = c.req.header('Authorization');

  // Verify authentication
  const authResult = await getAuthenticatedUser(authHeader || null, c.env);

  if (!authResult.success) {
    // Authentication failed - return error response
    return c.json(
      {
        error: 'Authentication required',
        message: authResult.error,
        authenticated: false,
      },
      authResult.statusCode
    );
  }

  // Authentication successful - store user in context
  c.set('user', authResult.user);

  // Continue to the next handler
  await next();
}

/**
 * Optional authentication middleware
 *
 * This middleware attempts to authenticate the request but does not block it if authentication fails.
 * Useful for routes that have different behavior for authenticated vs unauthenticated users.
 *
 * If authentication succeeds:
 * - Sets c.get('user') to the authenticated user
 *
 * If authentication fails:
 * - Does NOT return an error
 * - c.get('user') will be undefined
 * - The request continues to the next handler
 *
 * @param c - Hono context object
 * @param next - Next middleware function
 * @returns Promise that resolves when middleware completes
 *
 * @example
 * ```ts
 * import { optionalAuth } from './middleware/auth';
 *
 * app.get('/api/v1/content', optionalAuth, async (c) => {
 *   const user = c.get('user');
 *
 *   if (user) {
 *     // User is authenticated - show personalized content
 *     return c.json({
 *       message: `Welcome back, ${user.email}!`,
 *       content: 'Premium content here',
 *     });
 *   } else {
 *     // User is not authenticated - show public content
 *     return c.json({
 *       message: 'Welcome, guest!',
 *       content: 'Public content here',
 *     });
 *   }
 * });
 * ```
 *
 * @remarks
 * - Never returns an error response
 * - Always calls next() to continue the request
 * - Check if user exists with: `const user = c.get('user'); if (user) { ... }`
 */
export async function optionalAuth(
  c: Context<{ Bindings: Env; Variables: Partial<AuthVariables> }>,
  next: Next
): Promise<void> {
  // Get the Authorization header
  const authHeader = c.req.header('Authorization');

  // Attempt to verify authentication
  const authResult = await getAuthenticatedUser(authHeader || null, c.env);

  if (authResult.success) {
    // Authentication successful - store user in context
    c.set('user', authResult.user);
  }
  // If authentication fails, we don't set the user, but we don't return an error either

  // Always continue to the next handler
  await next();
}

