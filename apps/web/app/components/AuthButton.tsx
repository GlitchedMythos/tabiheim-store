/**
 * AuthButton Component
 *
 * A comprehensive authentication UI component that handles both sign-in and sign-out states.
 *
 * Features:
 * - Magic link sign-in form (email input + submit)
 * - Displays current user email when logged in
 * - Sign-out button for authenticated users
 * - Real-time auth state updates
 * - Loading states and error handling
 * - Success messages
 *
 * This component automatically detects the user's authentication status and shows
 * the appropriate UI (sign-in form or user info with sign-out button).
 *
 * @example
 * ```tsx
 * import { AuthButton } from '~/components/AuthButton';
 *
 * function MyPage() {
 *   return (
 *     <div>
 *       <AuthButton />
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { signInWithMagicLink, signOut, getCurrentUser, onAuthStateChange } from '~/lib/auth';
import type { User } from '@supabase/supabase-js';

export function AuthButton() {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check initial auth state on component mount
  useEffect(() => {
    async function checkUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setCheckingAuth(false);
    }
    checkUser();
  }, []);

  // Listen for auth state changes (sign in, sign out, token refresh)
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setUser(session?.user || null);

      // Clear any messages when auth state changes
      if (event === 'SIGNED_IN') {
        setMessage({ type: 'success', text: 'Successfully signed in!' });
        setTimeout(() => setMessage(null), 5000);
      } else if (event === 'SIGNED_OUT') {
        setMessage({ type: 'success', text: 'Successfully signed out!' });
        setTimeout(() => setMessage(null), 5000);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Handle magic link sign-in form submission
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await signInWithMagicLink(email);

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Magic link sent!' });
      setEmail(''); // Clear the email input
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send magic link' });
    }

    setLoading(false);
  };

  /**
   * Handle sign-out button click
   */
  const handleSignOut = async () => {
    setLoading(true);
    setMessage(null);

    const result = await signOut();

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Failed to sign out' });
    }

    setLoading(false);
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        <span className="text-sm">Checking authentication...</span>
      </div>
    );
  }

  // User is logged in - show user info and sign-out button
  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Signed in as:</p>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex-shrink-0 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    );
  }

  // User is not logged in - show sign-in form
  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSignIn} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Sign in with Magic Link
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                'Send Magic Link'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            We'll send you a magic link to sign in without a password.
            {' '}
            <span className="block mt-1">
              📧 In local dev, check{' '}
              <a
                href="http://localhost:54324"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Inbucket (localhost:54324)
              </a>
              {' '}for the email.
            </span>
          </p>
        </div>
      </form>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Test users hint for development */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 font-medium mb-1">💡 Development Test Users:</p>
        <div className="text-xs text-blue-700 space-y-0.5">
          <p>• test1@example.com</p>
          <p>• test2@example.com</p>
          <p>• demo@example.com</p>
        </div>
      </div>
    </div>
  );
}

