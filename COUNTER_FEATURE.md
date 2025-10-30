# Real-time Counter Feature

## Overview
A full-stack real-time counter application built with Supabase, Hono (API), and React Router (Web).

## Features
- ✅ Real-time synchronization across all viewers
- ✅ Increment/Decrement counter functionality
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Supabase PostgreSQL database with Row Level Security
- ✅ REST API endpoints with CORS support
- ✅ Real-time updates via Supabase Realtime

## Architecture

### Backend (api-worker)
- **Framework**: Hono on Cloudflare Workers
- **Database**: Supabase PostgreSQL
- **Endpoints**:
  - `GET /api/v1/counter` - Get current counter value
  - `POST /api/v1/counter/increment` - Increment by 1
  - `POST /api/v1/counter/decrement` - Decrement by 1

### Frontend (web)
- **Framework**: React Router v7
- **Styling**: Tailwind CSS v4
- **Real-time**: Supabase Realtime subscriptions
- **Routes**:
  - `/` - Home page with link to counter
  - `/counter` - Real-time counter interface

### Database Schema
```sql
CREATE TABLE public.counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT counter_single_row CHECK (id = 1)
);
```

## Getting Started

### Prerequisites
- Node.js and pnpm installed
- Supabase CLI installed
- Both api-worker and web servers running

### Running the Application

1. **Start Supabase (if not already running)**:
   ```bash
   cd apps/api-worker
   npx supabase start
   ```

2. **Configure Web App Environment**:
   ```bash
   cd apps/web
   # Create .env file with:
   # VITE_SUPABASE_URL=http://127.0.0.1:54321
   # VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   # See ENV_SETUP.md for details
   ```

3. **Start the API Worker**:
   ```bash
   cd apps/api-worker
   pnpm dev
   # Runs on http://localhost:8787
   ```

4. **Start the Web App**:
   ```bash
   cd apps/web
   pnpm dev
   # Runs on http://localhost:5173
   ```

5. **Access the Application**:
   - Open http://localhost:5173 in your browser
   - Click "Try Real-time Counter" button
   - Test increment/decrement buttons
   - Open in multiple browser tabs to see real-time sync!

## Testing Real-time Functionality

1. Open the counter page in two or more browser windows/tabs
2. Click increment or decrement in one window
3. Watch the counter update automatically in all other windows
4. The green dot indicator shows the real-time connection status

## API Testing

Test the API directly using curl:

```bash
# Get current counter value
curl http://localhost:8787/api/v1/counter

# Increment the counter
curl -X POST http://localhost:8787/api/v1/counter/increment

# Decrement the counter
curl -X POST http://localhost:8787/api/v1/counter/decrement
```

## Environment Variables

### api-worker/.dev.vars
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### web/.env
Create a `.env` file in `apps/web`:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Important**:
- ⚠️ The `.env` file is gitignored and must be created manually
- ✅ The app will throw an error if these variables are not set
- ✅ `VITE_` prefix is required for Vite to expose variables to the client
- 📖 See `apps/web/ENV_SETUP.md` for detailed setup instructions

## Files Created/Modified

### Backend
- ✅ `apps/api-worker/supabase/migrations/00001_create_counter_table.sql` - Database schema
- ✅ `apps/api-worker/src/index.ts` - Added counter endpoints and CORS

### Frontend
- ✅ `apps/web/app/lib/supabase.ts` - Supabase client utility with environment validation
- ✅ `apps/web/app/routes/counter.tsx` - Counter page component
- ✅ `apps/web/app/routes.ts` - Added counter route
- ✅ `apps/web/app/routes/home.tsx` - Added navigation link
- ✅ `apps/web/app/root.tsx` - Simplified for SPA mode
- ✅ `apps/web/ENV_SETUP.md` - Environment setup guide
- ⚠️ `apps/web/.env` - Must be created manually (see ENV_SETUP.md)

## How Real-time Works

1. **Client subscribes** to `counter` table changes via Supabase Realtime
2. **User clicks** increment/decrement button
3. **Frontend calls** REST API endpoint
4. **Backend updates** database row
5. **Supabase broadcasts** change to all subscribed clients
6. **All clients** receive update and refresh their UI instantly

## Troubleshooting

### "VITE_SUPABASE_URL is not set" or "VITE_SUPABASE_ANON_KEY is not set"
If you see this error:
- **Cause**: Environment variables are not configured
- **Solution**: Create a `.env` file in `apps/web` with the required variables:
  ```bash
  cd apps/web
  # Create .env file with content from ENV_SETUP.md
  ```
  See `apps/web/ENV_SETUP.md` for detailed instructions.

### "supabaseKey is required" Error
If you see this error in the web app console:
- **Cause**: The `.env` file exists but variables are empty or incorrectly formatted
- **Solution**: Verify the `.env` file has correct values and restart the dev server

### Real-time Updates Not Working
If the counter doesn't update in real-time:
1. Check the browser console for WebSocket errors
2. Verify the Supabase Realtime service is running: `npx supabase status`
3. Check that the migration was applied: look for the green "Connected" indicator
4. Verify port 54321 is accessible (local Supabase API)

### API Endpoints Return 404
If API calls fail:
1. Verify the API worker is running on port 8787
2. Check CORS is enabled (already configured in the code)
3. Test endpoints directly with curl (see API Testing section)

## Next Steps

- Deploy to production (Cloudflare Workers + Cloudflare Pages)
- Add authentication to track who made changes
- Add counter history/changelog
- Add rate limiting to prevent abuse
- Add optimistic UI updates
- Add animations for counter changes

