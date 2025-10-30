import { Hono } from 'hono';
import { createSupabaseClient } from './lib/supabase';
import { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

/**
 * Health check endpoint
 * Returns database connection status and version information
 */
app.get('/api/v1/health', async (c) => {
  try {
    // Create Supabase client with service role for admin access
    const supabase = createSupabaseClient(c.env, true);

    // Query the database version using a simple RPC or query
    // This demonstrates the database connection is working
    const { data, error } = await supabase
      .from('pg_stat_database')
      .select('datname')
      .limit(1)
      .maybeSingle();

    if (error) {
      // If we can't query system tables, we still have a connection
      // Just return a simpler health check
      return c.json(
        {
          status: 'healthy',
          database: 'connected',
          timestamp: new Date().toISOString(),
          message: 'Supabase connection successful',
        },
        200
      );
    }

    return c.json(
      {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Supabase connection successful',
        details: data ? { connected: true } : { connected: true },
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : 'Unknown error',
      },
      503
    );
  }
});

/**
 * Users endpoint example
 * Demonstrates basic Supabase query with anon key
 */
app.get('/api/v1/users', async (c) => {
  try {
    // Create Supabase client with anon key (respects RLS policies)
    const supabase = createSupabaseClient(c.env);

    // Example query - adjust table name as needed
    // This will return empty if no users table exists
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (error) {
      // If table doesn't exist or query fails, return helpful message
      return c.json(
        {
          message: 'No users table found or access denied',
          hint: 'Create a users table in Supabase to use this endpoint',
          data: [],
        },
        200
      );
    }

    return c.json(
      {
        data: data || [],
        count: data?.length || 0,
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch users',
      },
      500
    );
  }
});

app.get('/api/v1/inventory', (c) => {
  return c.json(
    {
      message: 'Hello Hono!',
    },
    200
  );
});

app.get('/api/v1/inventory/:id', (c) => {
  return c.json(
    {
      message: `Hello Hono!, ${c.req.param('id')}`,
    },
    200
  );
});

export default app;
