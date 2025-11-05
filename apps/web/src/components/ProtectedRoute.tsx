import { useSession } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component
 *
 * Checks if user is authenticated using Better-Auth's useSession hook
 * Redirects to /login if not authenticated
 * Shows loading state while checking session
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

