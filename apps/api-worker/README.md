# Tabiheim Inventory API

A Cloudflare Worker-based API built with Hono and integrated with Supabase for database operations.

## Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- A Supabase account and project
- Cloudflare account (for deployment)

### Installation

```bash
pnpm install
```

### Environment Configuration

#### Local Development

1. Copy the example environment file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Fill in your Supabase credentials in `.dev.vars`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

   You can find these values in your Supabase project settings:
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to Settings > API
   - Copy the URL and keys

#### Production Deployment

For production, set environment variables using Wrangler:

```bash
# Set Supabase URL
wrangler secret put SUPABASE_URL

# Set Supabase anon key
wrangler secret put SUPABASE_ANON_KEY

# Set Supabase service role key
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Alternatively, you can set these in the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Navigate to Settings > Variables
4. Add the environment variables

## Development

Run the development server:

```bash
pnpm run dev
```

The API will be available at `http://localhost:8787`

## Deployment

Deploy to Cloudflare Workers:

```bash
pnpm run deploy
```

## API Endpoints

### Health Check

Check the API and database connection status.

```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "message": "Supabase connection successful"
}
```

**Example:**
```bash
curl http://localhost:8787/api/v1/health
```

### Users (Example)

Example endpoint demonstrating Supabase queries with RLS policies.

```http
GET /api/v1/users
```

**Response:**
```json
{
  "data": [],
  "count": 0
}
```

**Example:**
```bash
curl http://localhost:8787/api/v1/users
```

### Inventory

```http
GET /api/v1/inventory
```

**Response:**
```json
{
  "message": "Hello Hono!"
}
```

### Inventory Item

```http
GET /api/v1/inventory/:id
```

**Parameters:**
- `id` - The inventory item ID

**Response:**
```json
{
  "message": "Hello Hono!, {id}"
}
```

## Architecture

### Project Structure

```
src/
├── index.ts          # Main application and route definitions
├── types.ts          # TypeScript type definitions
└── lib/
    └── supabase.ts   # Supabase client factory
```

### Supabase Client

The project includes a reusable Supabase client factory that's configured for Cloudflare Workers:

```typescript
import { createSupabaseClient } from './lib/supabase';

// Create client with anon key (respects RLS policies)
const supabase = createSupabaseClient(env);

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createSupabaseClient(env, true);
```

### Type Safety

The project uses TypeScript with proper type definitions for Cloudflare environment bindings:

```typescript
import { Env } from './types';

const app = new Hono<{ Bindings: Env }>();
```

## TypeScript Support

Generate/synchronize types based on your Worker configuration:

```bash
pnpm run cf-typegen
```

## Troubleshooting

### Environment Variables Not Found

If you see errors about missing environment variables:
1. Ensure `.dev.vars` exists and contains all required variables
2. Restart the development server after creating/modifying `.dev.vars`
3. For production, verify secrets are set using `wrangler secret list`

### Supabase Connection Issues

If the health check fails:
1. Verify your Supabase project URL is correct
2. Ensure your API keys are valid
3. Check that your Supabase project is active
4. Review Cloudflare Workers logs for detailed error messages

### CORS Issues

If you encounter CORS errors when calling from a web application, consider adding the Hono CORS middleware:

```typescript
import { cors } from 'hono/cors';

app.use('/*', cors());
```

## Resources

- [Hono Documentation](https://hono.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/)
