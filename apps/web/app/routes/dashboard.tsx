/**
 * Protected Dashboard Route
 *
 * This is an example of a protected route that requires authentication.
 * Users who are not logged in will see a message prompting them to sign in.
 *
 * Key features demonstrated:
 * - Authentication check on component mount
 * - Displaying user information from the session
 * - JWT token display for API authentication
 * - Protected API endpoint testing
 * - Sign-out functionality
 *
 * @module routes/dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/dashboard';
import { getCurrentUser, getSession, signOut } from '~/lib/auth';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Metadata for the dashboard page
 */
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dashboard - Tabiheim' },
    { name: 'description', content: 'Protected dashboard area' },
  ];
}

/**
 * Protected Dashboard Component
 *
 * Displays user information and provides access to protected features.
 * Includes a button to test the protected API endpoint.
 */
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    async function loadUserData() {
      const currentUser = await getCurrentUser();
      const currentSession = await getSession();

      setUser(currentUser);
      setSession(currentSession);
      setLoading(false);
    }

    loadUserData();
  }, []);

  /**
   * Test the protected API endpoint
   * This demonstrates how to make authenticated API requests using the JWT token
   */
  const testProtectedApi = async () => {
    setApiLoading(true);
    setApiError(null);
    setApiResponse(null);

    try {
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      // Make authenticated request to protected API endpoint
      const response = await fetch('http://localhost:8787/api/v1/protected/test', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API returned ${response.status}`);
      }

      setApiResponse(data);
    } catch (error) {
      console.error('API error:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to call API');
    } finally {
      setApiLoading(false);
    }
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    await signOut();
    // Redirect to home after sign out
    window.location.href = '/';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Required
              </h1>
              <p className="text-gray-600">
                This page is protected. Please sign in to access the dashboard.
              </p>
            </div>

            <Link
              to="/"
              className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Go to Home & Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Your Dashboard! 🎉
              </h1>
              <p className="text-gray-600">
                This is a protected route that requires authentication.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* User Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
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
            User Information
          </h2>

          <div className="grid gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500">Email</span>
              <span className="text-base text-gray-900">{user.email}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500">User ID</span>
              <span className="text-base text-gray-900 font-mono text-sm break-all">
                {user.id}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500">Account Created</span>
              <span className="text-base text-gray-900">
                {new Date(user.created_at || '').toLocaleString()}
              </span>
            </div>

            {user.user_metadata?.full_name && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-500">Full Name</span>
                <span className="text-base text-gray-900">
                  {user.user_metadata.full_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            Session Information
          </h2>

          <div className="grid gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500">Token Type</span>
              <span className="text-base text-gray-900">Bearer</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500">Token Expires At</span>
              <span className="text-base text-gray-900">
                {session?.expires_at
                  ? new Date(session.expires_at * 1000).toLocaleString()
                  : 'N/A'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500">Access Token (JWT)</span>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto">
                <code className="text-xs text-gray-800 break-all">
                  {session?.access_token ?
                    `${session.access_token.substring(0, 50)}...` :
                    'No token available'
                  }
                </code>
              </div>
              <span className="text-xs text-gray-500">
                💡 This JWT token is used in the Authorization header for API requests
              </span>
            </div>
          </div>
        </div>

        {/* Protected API Test Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Test Protected API Endpoint
          </h2>

          <p className="text-gray-600 mb-4">
            Click the button below to test the protected API endpoint. This demonstrates
            how to make authenticated requests using your JWT token.
          </p>

          <button
            onClick={testProtectedApi}
            disabled={apiLoading}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {apiLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Testing API...
              </span>
            ) : (
              'Test Protected Endpoint'
            )}
          </button>

          {/* API Response */}
          {(apiResponse || apiError) && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                API Response:
              </h3>
              <div className={`p-4 rounded-lg border ${
                apiError
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <pre className="text-sm overflow-x-auto">
                  {apiError || JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link
            to="/"
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            ← Back to Home
          </Link>
          <Link
            to="/counter"
            className="flex-1 px-6 py-3 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors text-center"
          >
            Try Counter Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}

