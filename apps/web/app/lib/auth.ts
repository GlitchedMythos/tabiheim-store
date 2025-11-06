import { createAuthClient } from 'better-auth/client';
import { adminClient, organizationClient, magicLinkClient } from 'better-auth/client/plugins';

/**
 * Better Auth client configuration
 *
 * This client communicates with the Better-Auth backend API
 * mounted at /api/auth on the backend server.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8787',

  plugins: [
    adminClient(),
    organizationClient(),
    magicLinkClient(),
  ],
});

/**
 * Export types from better-auth for convenience
 */
export type { User } from 'better-auth/types';

