import type { Config } from '@react-router/dev/config';

/**
 * React Router Configuration
 *
 * This configures React Router in Framework Mode for SPA deployment.
 * - appDirectory: Location of the source code
 * - ssr: false - Disables server-side rendering for SPA mode
 */
export default {
  appDirectory: 'src',
  ssr: false,
} satisfies Config;


