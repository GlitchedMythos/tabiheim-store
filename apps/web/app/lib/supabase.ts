import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase configuration from environment
 * Tries multiple sources: Vite env, window.ENV
 * Throws an error if required variables are not found
 *
 * For network development: If accessing via network IP (not localhost),
 * automatically replaces localhost/127.0.0.1 in Supabase URL with current hostname
 */
function getSupabaseConfig() {
  let supabaseUrl: string | undefined;
  let supabaseAnonKey: string | undefined;

  // Try to get from Vite environment variables (prefixed with VITE_)
  if (typeof import.meta.env !== 'undefined') {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  // Try to get from window.ENV (for SSR/Cloudflare Pages)
  if (typeof window !== 'undefined' && (window as any).ENV) {
    supabaseUrl = supabaseUrl || (window as any).ENV.SUPABASE_URL;
    supabaseAnonKey = supabaseAnonKey || (window as any).ENV.SUPABASE_ANON_KEY;
  }

  // Validate that required environment variables are set
  if (!supabaseUrl) {
    throw new Error(
      'VITE_SUPABASE_URL is not set. Please create a .env file in apps/web with:\n' +
      'VITE_SUPABASE_URL=http://127.0.0.1:54321\n' +
      'VITE_SUPABASE_ANON_KEY=<your-anon-key>'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is not set. Please create a .env file in apps/web with:\n' +
      'VITE_SUPABASE_URL=http://127.0.0.1:54321\n' +
      'VITE_SUPABASE_ANON_KEY=<your-anon-key>'
    );
  }

  // Network development support: Replace localhost with current hostname when accessed via network
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;

    // If we're not on localhost/127.0.0.1, but the Supabase URL uses localhost,
    // replace it with the current hostname to support network access (e.g., from phone)
    const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
    const supabaseUsesLocalhost = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

    if (!isLocalhost && supabaseUsesLocalhost) {
      // Replace localhost or 127.0.0.1 with the current hostname
      supabaseUrl = supabaseUrl
        .replace('localhost', currentHost)
        .replace('127.0.0.1', currentHost);

      console.log(`Network access detected: Using Supabase URL with host ${currentHost}`);
    }
  }

  return { supabaseUrl, supabaseAnonKey };
}

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance
 * Lazily initialized on first use
 */
function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

    console.log('Initializing Supabase client with URL:', supabaseUrl);

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Enable automatic token refresh
        autoRefreshToken: true,
        // Persist session in localStorage for cross-tab and reload persistence
        persistSession: true,
        // Detect auth redirect in URL after magic link click
        detectSessionInUrl: true,
        // Storage key for session data
        storageKey: 'supabase.auth.token',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseInstance;
}

/**
 * Supabase client instance for browser use
 * Configured with real-time support and authentication
 *
 * Features:
 * - Automatic session persistence in localStorage
 * - Automatic token refresh
 * - Real-time subscriptions
 * - Magic link authentication support
 *
 * @remarks
 * The client is lazily initialized on first use to avoid initialization errors
 * in SSR environments or during build time.
 */
export const supabase = getSupabaseClient();

