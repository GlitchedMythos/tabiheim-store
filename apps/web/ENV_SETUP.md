# Environment Setup for Web App

This web application requires Supabase environment variables to be configured.

## Local Development

1. **Create a `.env` file** in the `apps/web` directory:

```bash
cd apps/web
touch .env
```

2. **Add the following content** to the `.env` file:

```env
# Local Supabase instance (started with `npx supabase start` in api-worker)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

> **Note**: The key above is the default Supabase local development key. It's safe to use for local development.

3. **Restart the dev server** for changes to take effect:

```bash
pnpm dev
```

## Production

For production deployment:

1. Get your Supabase project URL and anon key from your [Supabase Dashboard](https://app.supabase.com)

2. Set environment variables in your hosting platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Cloudflare Pages

Set environment variables in the Cloudflare Pages dashboard:
- Navigate to your project settings
- Go to "Environment variables"
- Add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Important Notes

- ⚠️ **Never commit the `.env` file** - it's gitignored by default
- ✅ The `VITE_` prefix is required for Vite to expose variables to the client
- ✅ The app will throw a clear error if environment variables are missing
- ✅ Anon keys are safe to expose to the client (they work with Row Level Security)

## Troubleshooting

### Error: "VITE_SUPABASE_URL is not set"

This means the `.env` file is missing or not properly configured. Follow the steps above to create it.

### Environment variables not loading

1. Make sure the `.env` file is in the `apps/web` directory
2. Restart the dev server after creating/modifying `.env`
3. Check that variable names start with `VITE_`
4. Verify there are no quotes around the values in `.env`

