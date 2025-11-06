import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client configuration
 *
 * The baseURL should match the API's basePath (/api/auth)
 * During development, Vite proxies /api/* to http://localhost:8787
 *
 * Better-Auth requires a full URL, so we construct it from the current origin
 * combined with the /api/auth path (matching the backend basePath)
 *
 * fetchOptions includes credentials to ensure cookies are sent with all requests
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/auth`
    : `${window.location.origin}/api/auth`,
  fetchOptions: {
    credentials: 'include',
  },
});

// Export hooks and methods for use in components
export const { useSession, signIn, signOut, signUp } = authClient;
