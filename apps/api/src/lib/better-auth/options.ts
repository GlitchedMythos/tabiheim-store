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
   * @default "/api/auth"
   */
  basePath: '/api',
  emailAndPassword: {
    enabled: true,
  },
  // .... More options
};
