import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from '../types';

/**
 * Creates a Supabase client configured for Cloudflare Workers
 *
 * @param env - Cloudflare Worker environment bindings
 * @param useServiceRole - If true, uses service role key (bypasses RLS). Default: false
 * @returns Configured Supabase client instance
 *
 * @example
 * ```ts
 * // Create client with anon key (respects RLS)
 * const supabase = createSupabaseClient(env);
 *
 * // Create client with service role key (bypasses RLS)
 * const supabaseAdmin = createSupabaseClient(env, true);
 * ```
 */
export function createSupabaseClient<Database = any>(
  env: Env,
  useServiceRole = false
): SupabaseClient<Database> {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = useServiceRole
    ? env.SUPABASE_SERVICE_ROLE_KEY
    : env.SUPABASE_ANON_KEY;

  // Validate required environment variables
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  if (!supabaseKey) {
    const keyType = useServiceRole
      ? 'SUPABASE_SERVICE_ROLE_KEY'
      : 'SUPABASE_ANON_KEY';
    throw new Error(`${keyType} is not configured`);
  }

  // Create client with Cloudflare Workers configuration
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      // Disable auto-refresh for serverless environment
      autoRefreshToken: false,
      // Don't persist session in serverless environment
      persistSession: false,
      // Don't detect session in URL (server-side)
      detectSessionInUrl: false,
    },
  });
}
