/**
 * Authentication Utilities for Supabase
 *
 * This module provides helper functions for managing authentication in the web app.
 * It uses Supabase's built-in authentication system with magic link (passwordless) support.
 *
 * Key Features:
 * - Magic link authentication (no passwords needed)
 * - Session management with automatic token refresh
 * - User state management
 * - JWT token retrieval for API calls
 *
 * @module auth
 */

import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Authentication result type for sign-in operations
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Send a magic link to the user's email for passwordless authentication
 *
 * This function triggers an email with a magic link that the user can click to sign in.
 * The link contains a one-time token that automatically authenticates the user when clicked.
 *
 * Flow:
 * 1. User enters their email address
 * 2. This function sends a magic link to that email via Supabase Auth
 * 3. User receives email and clicks the link
 * 4. User is redirected back to the app and automatically signed in
 * 5. Session is stored in localStorage for persistence
 *
 * @param email - The user's email address
 * @returns Promise with success status and optional error message
 *
 * @example
 * ```tsx
 * const result = await signInWithMagicLink('user@example.com');
 * if (result.success) {
 *   console.log('Magic link sent! Check your email.');
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 *
 * @remarks
 * - The magic link expires after 1 hour (configurable in Supabase settings)
 * - In local development, emails are sent to Inbucket (http://localhost:54324)
 * - The user must already exist in the auth.users table (or signups must be enabled)
 */
export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      };
    }

    // Send magic link via Supabase Auth
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Email redirect URL - where user lands after clicking magic link
        // This should match one of the allowed redirect URLs in Supabase config
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Magic link sent! Check your email to sign in.',
    };
  } catch (error) {
    console.error('Unexpected error sending magic link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Verify the OTP code sent to the user's email
 *
 * This function verifies the one-time password (OTP) code that was sent to the user's
 * email address. Once verified, it creates an authenticated session for the user.
 *
 * Flow:
 * 1. User receives OTP code in their email (6-digit code)
 * 2. User enters the code in the verification form
 * 3. This function verifies the code with Supabase Auth
 * 4. If valid, user is signed in and session is created
 * 5. Session is stored in localStorage for persistence
 *
 * @param email - The user's email address
 * @param token - The 6-digit OTP code from the email
 * @returns Promise with success status and optional error message
 *
 * @example
 * ```tsx
 * const result = await verifyOtp('user@example.com', '123456');
 * if (result.success) {
 *   console.log('Successfully verified! User is now signed in.');
 * } else {
 *   console.error('Verification failed:', result.error);
 * }
 * ```
 *
 * @remarks
 * - The OTP code expires after a short time (typically 5-10 minutes)
 * - Each code can only be used once
 * - After 3-5 failed attempts, the code may be invalidated for security
 */
export async function verifyOtp(email: string, token: string): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      };
    }

    if (!token || token.length !== 6) {
      return {
        success: false,
        error: 'Please enter a valid 6-digit code',
      };
    }

    // Verify OTP code via Supabase Auth
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('OTP verification error:', error);

      // Provide more user-friendly error messages
      let errorMessage = error.message;
      if (error.message.toLowerCase().includes('expired')) {
        errorMessage = 'This code has expired. Please request a new one.';
      } else if (error.message.toLowerCase().includes('invalid')) {
        errorMessage = 'Invalid code. Please check and try again.';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      message: 'Successfully verified! You are now signed in.',
    };
  } catch (error) {
    console.error('Unexpected error verifying OTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Sign out the current user
 *
 * This function:
 * - Invalidates the current session on the server
 * - Clears the session from localStorage
 * - Removes all authentication tokens
 *
 * @returns Promise with success status and optional error message
 *
 * @example
 * ```tsx
 * const result = await signOut();
 * if (result.success) {
 *   // Redirect to home page or show logged out state
 *   window.location.href = '/';
 * }
 * ```
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Successfully signed out',
    };
  } catch (error) {
    console.error('Unexpected error signing out:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Get the currently authenticated user
 *
 * This function retrieves the user object from the current session.
 * Returns null if no user is currently authenticated.
 *
 * The user object includes:
 * - id: Unique user identifier (UUID)
 * - email: User's email address
 * - user_metadata: Custom user data
 * - app_metadata: System metadata
 * - created_at: Account creation timestamp
 *
 * @returns Promise with the User object or null
 *
 * @example
 * ```tsx
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Logged in as:', user.email);
 * } else {
 *   console.log('Not logged in');
 * }
 * ```
 *
 * @remarks
 * This function reads from the local session cache and is fast.
 * It does not make a network request unless the session needs to be refreshed.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Don't log "session missing" as an error - it's the expected state when not logged in
      if (error.message !== 'Auth session missing!') {
        console.error('Error getting current user:', error);
      }
      return null;
    }

    return user;
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return null;
  }
}

/**
 * Get the current authentication session
 *
 * The session object includes:
 * - access_token: JWT token for API authentication (use this for Bearer token)
 * - refresh_token: Token for refreshing expired access tokens
 * - expires_at: Unix timestamp when the access token expires
 * - user: The authenticated user object
 *
 * @returns Promise with the Session object or null
 *
 * @example
 * ```tsx
 * const session = await getSession();
 * if (session) {
 *   // Use the access token to authenticate API requests
 *   const response = await fetch('http://localhost:8787/api/v1/protected/test', {
 *     headers: {
 *       'Authorization': `Bearer ${session.access_token}`,
 *     },
 *   });
 * }
 * ```
 *
 * @remarks
 * - The access token is a JWT that includes user information and permissions
 * - Tokens automatically refresh when they expire (if refresh_token is valid)
 * - Store the access token securely and never expose it in URLs or logs
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      // Don't log "session missing" as an error - it's the expected state when not logged in
      if (error.message !== 'Auth session missing!') {
        console.error('Error getting session:', error);
      }
      return null;
    }

    return session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
}

/**
 * Get the JWT access token for the current session
 *
 * This is a convenience function that extracts just the access token from the session.
 * Use this token in the Authorization header when making authenticated API requests.
 *
 * @returns Promise with the JWT access token string or null
 *
 * @example
 * ```tsx
 * const token = await getAccessToken();
 * if (token) {
 *   const response = await fetch('http://localhost:8787/api/v1/protected/test', {
 *     headers: {
 *       'Authorization': `Bearer ${token}`,
 *     },
 *   });
 * }
 * ```
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token || null;
}

/**
 * Check if a user is currently authenticated
 *
 * This is a quick helper to check authentication status.
 *
 * @returns Promise with boolean indicating if user is authenticated
 *
 * @example
 * ```tsx
 * const isLoggedIn = await isAuthenticated();
 * if (!isLoggedIn) {
 *   // Redirect to login page or show sign-in UI
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Listen for authentication state changes
 *
 * This function sets up a listener that fires whenever the auth state changes,
 * such as when a user signs in, signs out, or their token is refreshed.
 *
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function to remove the listener
 *
 * @example
 * ```tsx
 * // In a React component
 * useEffect(() => {
 *   const unsubscribe = onAuthStateChange((event, session) => {
 *     console.log('Auth state changed:', event);
 *     if (event === 'SIGNED_IN') {
 *       console.log('User signed in:', session?.user.email);
 *     } else if (event === 'SIGNED_OUT') {
 *       console.log('User signed out');
 *     }
 *   });
 *
 *   return () => unsubscribe();
 * }, []);
 * ```
 *
 * @remarks
 * Events include: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

