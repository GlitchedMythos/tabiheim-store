/**
 * Cloudflare Worker Environment Bindings
 *
 * This interface defines the environment variables and bindings
 * available in the Cloudflare Worker runtime.
 */
export interface Env {
  /**
   * Supabase project URL
   * @example "https://xyzcompany.supabase.co"
   */
  SUPABASE_URL: string;

  /**
   * Supabase anonymous/public API key
   * Used for client-side operations with RLS policies
   */
  SUPABASE_ANON_KEY: string;

  /**
   * Supabase service role key
   * Used for server-side operations with elevated privileges
   * @warning This key bypasses Row Level Security. Use with caution.
   */
  SUPABASE_SERVICE_ROLE_KEY: string;
}

