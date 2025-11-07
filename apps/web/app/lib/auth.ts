import { createAuthClient } from 'better-auth/client';
import {
  adminClient,
  magicLinkClient,
  organizationClient,
} from 'better-auth/client/plugins';

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  console.info('🔍 VITE_API_URL is not set, using default value');
}

console.log('all env variables:', import.meta.env);

/**
 * Better Auth client configuration
 *
 * This client communicates with the Better-Auth backend API
 * mounted at /api/auth on the backend server.
 */
export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient(), organizationClient(), magicLinkClient()],
});

console.log('🔍 Auth client created with baseURL:', baseURL);

/**
 * Export types from better-auth for convenience
 */
export type { User } from 'better-auth/types';
