import type { RouteConfig } from '@react-router/dev/routes';
import { index, route } from '@react-router/dev/routes';

/**
 * React Router Framework Mode Routes
 *
 * This defines the application routes using the file-based routing API.
 * Routes are mapped to component files in the routes/ directory.
 *
 * Note: root.tsx is automatically used as the root layout by React Router
 */
export default [
  index('./routes/home.tsx'),
  route('login', './routes/login.tsx'),
  route('register', './routes/register.tsx'),
  route('dashboard', './routes/dashboard.tsx'),
] satisfies RouteConfig;

