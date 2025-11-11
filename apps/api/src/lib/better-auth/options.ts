import { BetterAuthOptions } from 'better-auth';
import { admin, magicLink, organization } from 'better-auth/plugins';
import { sendMagicLinkEmail } from '../email';

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const getBetterAuthOptions = (
  env: CloudflareBindings
): Omit<BetterAuthOptions, 'database' | 'baseURL' | 'secret'> => ({
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
   * Parsed from TRUSTED_ORIGINS environment variable (comma-separated).
   */
  trustedOrigins: env.TRUSTED_ORIGINS.split(',').map((origin) =>
    origin.trim()
  ),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin(),
    organization(),
    magicLink({
      async sendMagicLink({ email, url, token }) {
        try {
          await sendMagicLinkEmail(env, email, url, token);
        } catch (error) {
          console.error('Error sending magic link email:', error);
          throw error;
        }
      },
      expiresIn: 300,
      disableSignUp: true,
    }),
  ],
  // .... More options
});
