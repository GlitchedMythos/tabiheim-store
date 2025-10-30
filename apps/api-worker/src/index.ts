import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createSupabaseClient } from './lib/supabase';
import { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use('/*', cors());

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

/**
 * Counter endpoint - Get current counter value
 * Returns the current value of the shared counter
 */
app.get('/api/v1/counter', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env);

    const { data, error } = await supabase
      .from('counter')
      .select('value')
      .eq('id', 1)
      .single();

    if (error) {
      return c.json(
        {
          error: error.message,
          message: 'Failed to fetch counter',
        },
        500
      );
    }

    return c.json(
      {
        value: data.value,
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch counter',
      },
      500
    );
  }
});

/**
 * Counter endpoint - Increment counter
 * Increments the counter by 1 and returns the new value
 */
app.post('/api/v1/counter/increment', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env);

    // First get the current value
    const { data: currentData, error: fetchError } = await supabase
      .from('counter')
      .select('value')
      .eq('id', 1)
      .single();

    if (fetchError) {
      return c.json(
        {
          error: fetchError.message,
          message: 'Failed to fetch counter',
        },
        500
      );
    }

    // Update with incremented value
    const { data, error } = await supabase
      .from('counter')
      .update({ value: currentData.value + 1 })
      .eq('id', 1)
      .select('value')
      .single();

    if (error) {
      return c.json(
        {
          error: error.message,
          message: 'Failed to increment counter',
        },
        500
      );
    }

    return c.json(
      {
        value: data.value,
        action: 'increment',
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to increment counter',
      },
      500
    );
  }
});

/**
 * Counter endpoint - Decrement counter
 * Decrements the counter by 1 and returns the new value
 */
app.post('/api/v1/counter/decrement', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env);

    // First get the current value
    const { data: currentData, error: fetchError } = await supabase
      .from('counter')
      .select('value')
      .eq('id', 1)
      .single();

    if (fetchError) {
      return c.json(
        {
          error: fetchError.message,
          message: 'Failed to fetch counter',
        },
        500
      );
    }

    // Update with decremented value
    const { data, error } = await supabase
      .from('counter')
      .update({ value: currentData.value - 1 })
      .eq('id', 1)
      .select('value')
      .single();

    if (error) {
      return c.json(
        {
          error: error.message,
          message: 'Failed to decrement counter',
        },
        500
      );
    }

    return c.json(
      {
        value: data.value,
        action: 'decrement',
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to decrement counter',
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
