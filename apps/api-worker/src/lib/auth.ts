/**
 * Authentication Helper Functions for API Worker
 *
 * This module provides utilities for JWT token verification and user authentication
 * in the Cloudflare Workers environment.
 *
 * Key Features:
 * - JWT token verification using Supabase
 * - User extraction from Authorization header
 * - Type-safe user information
 *
 * @module lib/auth
 */

import { createSupabaseClient } from './supabase';
import type { Env } from '../types';
import type { User } from '@supabase/supabase-js';

/**
 * Authentication result for successful verification
 */
export interface AuthSuccess {
  success: true;
  user: User;
}

/**
 * Authentication result for failed verification
 */
export interface AuthFailure {
  success: false;
  error: string;
  statusCode: 401 | 403;
}

/**
 * Union type for authentication results
 */
export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Verify a JWT access token and return the authenticated user
 *
 * This function:
 * 1. Creates a Supabase client with the provided environment bindings
 * 2. Uses the JWT token to fetch the user from Supabase Auth
 * 3. Validates the token signature and expiration
 * 4. Returns the user object if valid, or an error if not
 *
 * The JWT token is verified against Supabase's JWT secret, which ensures:
 * - The token was issued by your Supabase project
 * - The token hasn't been tampered with
 * - The token hasn't expired
 * - The user account still exists and is active
 *
 * @param token - The JWT access token from the Authorization header
 * @param env - Cloudflare Worker environment bindings (contains Supabase credentials)
 * @returns Promise with AuthResult containing user data or error
 *
 * @example
 * ```ts
 * const token = request.headers.get('Authorization')?.replace('Bearer ', '');
 *
 * if (!token) {
 *   return c.json({ error: 'Missing token' }, 401);
 * }
 *
 * const authResult = await verifyAuthToken(token, c.env);
 *
 * if (!authResult.success) {
 *   return c.json({ error: authResult.error }, authResult.statusCode);
 * }
 *
 * // Token is valid, use authResult.user
 * console.log('Authenticated user:', authResult.user.email);
 * ```
 *
 * @remarks
 * - This function makes a request to Supabase to verify the token
 * - The Supabase client uses the SUPABASE_ANON_KEY by default
 * - Token verification happens on every request (stateless authentication)
 * - Invalid tokens return 401 Unauthorized
 * - Valid tokens with inactive users return 403 Forbidden
 */
export async function verifyAuthToken(
  token: string,
  env: Env
): Promise<AuthResult> {
  try {
    // Create Supabase client (uses anon key by default)
    const supabase = createSupabaseClient(env);

    // Verify the JWT token and get the user
    // This method validates the token signature, expiration, and fetches the user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: error.message || 'Invalid or expired token',
        statusCode: 401,
      };
    }

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 403,
      };
    }

    // Token is valid and user exists
    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Unexpected error verifying token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      statusCode: 401,
    };
  }
}

/**
 * Extract the Bearer token from the Authorization header
 *
 * The Authorization header should be in the format: "Bearer <token>"
 * This function extracts just the token part.
 *
 * @param authHeader - The Authorization header value
 * @returns The JWT token string, or null if not found or malformed
 *
 * @example
 * ```ts
 * const authHeader = request.headers.get('Authorization');
 * const token = extractBearerToken(authHeader);
 *
 * if (!token) {
 *   return c.json({ error: 'Missing or invalid Authorization header' }, 401);
 * }
 * ```
 *
 * @remarks
 * - Returns null if the header is missing
 * - Returns null if the header doesn't start with "Bearer "
 * - The token should be a JWT string
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Check if the header starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  // Extract the token part (everything after "Bearer ")
  const token = authHeader.substring(7).trim();

  // Return null if the token is empty
  if (!token) {
    return null;
  }

  return token;
}

/**
 * Get authenticated user from request Authorization header
 *
 * This is a convenience function that combines extractBearerToken and verifyAuthToken.
 * It extracts the token from the request and verifies it in one step.
 *
 * @param authHeader - The Authorization header value from the request
 * @param env - Cloudflare Worker environment bindings
 * @returns Promise with AuthResult containing user data or error
 *
 * @example
 * ```ts
 * app.get('/api/protected', async (c) => {
 *   const authHeader = c.req.header('Authorization');
 *   const authResult = await getAuthenticatedUser(authHeader, c.env);
 *
 *   if (!authResult.success) {
 *     return c.json({ error: authResult.error }, authResult.statusCode);
 *   }
 *
 *   return c.json({
 *     message: 'Welcome!',
 *     user: authResult.user,
 *   });
 * });
 * ```
 */
export async function getAuthenticatedUser(
  authHeader: string | null,
  env: Env
): Promise<AuthResult> {
  // Extract token from Authorization header
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header. Expected format: "Bearer <token>"',
      statusCode: 401,
    };
  }

  // Verify the token and return the result
  return verifyAuthToken(token, env);
}

