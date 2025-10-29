import { Hono } from 'hono';

// Type declarations for Cloudflare Workers
interface Fetcher {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

type Env = {
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

// API routes - these take priority
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

// For all other routes, serve static assets or fallback to index.html for SPA
app.get('*', async (c) => {
  const assetsFetcher = c.env.ASSETS;
  const url = new URL(c.req.url);

  // Try to fetch the asset
  const assetResponse = await assetsFetcher.fetch(url.toString());

  // If asset exists (200) or is a redirect (3xx), return it
  if (assetResponse.status < 400) {
    return assetResponse;
  }

  // Otherwise, return index.html for SPA routing
  const indexUrl = new URL(url);
  indexUrl.pathname = '/index.html';
  return assetsFetcher.fetch(indexUrl.toString());
});

export default app;
