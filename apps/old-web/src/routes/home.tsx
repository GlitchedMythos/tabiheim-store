import { Navigate } from 'react-router';

/**
 * Home Route (/)
 *
 * Redirects to the login page
 */
export default function Home() {
  return <Navigate to="/login" replace />;
}


