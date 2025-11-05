import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/routes/Login';
import { Register } from '@/routes/Register';
import { Dashboard } from '@/routes/Dashboard';

/**
 * React Router configuration (SPA mode)
 *
 * Routes:
 * - / → redirects to /login
 * - /login → Login page
 * - /register → Register page
 * - /dashboard → Protected dashboard (requires authentication)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
]);

