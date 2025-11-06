import { useState, useEffect } from 'react';
import { authClient } from '../lib/auth';
import type { User } from '../lib/auth';

interface UseAuthReturn {
  user: User | null;
  session: any | null; // Using any for the full session object to avoid type conflicts
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing authentication state
 *
 * This hook provides:
 * - Current user and session data
 * - Loading state during session check
 * - isAuthenticated boolean for convenience
 * - signOut function
 * - refetch function to manually refresh session
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkSession() {
    try {
      const { data: sessionData } = await authClient.getSession();

      if (sessionData) {
        setSession(sessionData);
        setUser(sessionData.user);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to get session:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  async function signOut() {
    try {
      await authClient.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signOut,
    refetch: checkSession,
  };
}

