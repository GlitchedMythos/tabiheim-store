import { BetterAuthOptions } from 'better-auth';

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const betterAuthOptions: BetterAuthOptions = {
  /**
   * The name of the application.
   */
  appName: 'Tabiheim Games',
  /**
   * Base path for Better Auth.
   * Must match the Hono route mounting: /api/auth/*
   * @default "/api/auth"
   */
  basePath: '/api/auth',
  /**
   * Trusted origins for CORS.
   * Include the frontend URL to allow authentication requests.
   */
  trustedOrigins: ['http://localhost:5173', 'http://localhost:8787'],
  emailAndPassword: {
    enabled: true,
  },
  // .... More options
};
