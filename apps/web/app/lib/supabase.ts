import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase configuration from environment
 * Tries multiple sources: Vite env, window.ENV
 * Throws an error if required variables are not found
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
 * Configured with real-time support
 */
export const supabase = getSupabaseClient();

