# Authentication Implementation Overview

Complete guide to the Supabase authentication implementation in the Tabiheim project, covering architecture, flow, setup, and usage.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [How It Works](#how-it-works)
6. [Testing Guide](#testing-guide)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

This project implements **passwordless authentication** using Supabase Auth with **magic links** and **JWT token verification** for API requests.

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   WEB APP (React Router)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Homepage    │  │  Dashboard   │  │ AuthButton   │      │
│  │  (Public)    │  │  (Protected) │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Auth Helpers (lib/auth.ts)                                 │
│  ├─ signInWithMagicLink()                                   │
│  ├─ signOut()                                               │
│  ├─ getCurrentUser()                                        │
│  ├─ getSession()                                            │
│  └─ getAccessToken()  ──────────────────┐                   │
└─────────────────────┬────────────────────┼──────────────────┘
                      │                    │
                      │                    │ JWT Token
                      │                    │
                      ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE AUTH                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • User Management (auth.users)                      │   │
│  │  • JWT Token Issuance & Verification                 │   │
│  │  • Magic Link Generation & Sending                   │   │
│  │  • Session Management                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ Verify JWT
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           API WORKER (Cloudflare Workers)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Middleware (middleware/auth.ts)                │   │
│  │  ├─ requireAuth  (mandatory authentication)          │   │
│  │  └─ optionalAuth (optional authentication)           │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Protected Endpoints                                 │   │
│  │  ├─ GET /api/v1/protected/test                       │   │
│  │  │   Returns different responses based on auth       │   │
│  │  │   • 403 if not authenticated                      │   │
│  │  │   • 200 with user data if authenticated           │   │
│  │  └─ ... other protected routes                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Web App** | React Router 7 + React 19 | Frontend application |
| **API** | Hono + Cloudflare Workers | Backend API |
| **Auth Provider** | Supabase Auth | User authentication & JWT |
| **Database** | PostgreSQL (Supabase) | User data storage |
| **Email** | Inbucket (local) / SMTP (prod) | Magic link delivery |
| **Token Type** | JWT (JSON Web Token) | Stateless authentication |

---

## Authentication Flow

### 1. Sign-In Flow (Magic Link)

```
┌──────────┐
│   USER   │
└────┬─────┘
     │ 1. Enters email
     │    on web app
     ▼
┌─────────────┐
│  Web App    │
│  calls      │
│  signInWith │
│  MagicLink()│
└─────┬───────┘
      │ 2. Request OTP
      │    via API
      ▼
┌──────────────┐
│  Supabase    │
│  Auth        │
│  generates   │
│  magic link  │
└──────┬───────┘
       │ 3. Sends email
       │    with link
       ▼
┌──────────────┐
│  User's      │
│  Email       │
│  Inbox       │
└──────┬───────┘
       │ 4. User clicks
       │    magic link
       ▼
┌──────────────┐
│  Web App     │
│  receives    │
│  token from  │
│  URL params  │
└──────┬───────┘
       │ 5. Token stored
       │    in localStorage
       ▼
┌──────────────┐
│  User is     │
│  signed in   │
│  ✓           │
└──────────────┘
```

### 2. API Request Flow (Protected Endpoint)

```
┌──────────────┐
│  Web App     │
│  gets JWT    │
│  from session│
└──────┬───────┘
       │ 1. JWT Token:
       │    eyJhbGciOi...
       ▼
┌──────────────────────────┐
│  HTTP Request            │
│  GET /api/v1/protected/  │
│  Headers:                │
│    Authorization: Bearer │
│    <JWT_TOKEN>           │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  API Worker             │
│  optionalAuth middleware│
└────────┬────────────────┘
         │ 2. Extract token
         │    from header
         ▼
┌─────────────────────────┐
│  verifyAuthToken()      │
│  • Check signature      │
│  • Check expiration     │
│  • Fetch user from DB   │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └─┬────┬──┘
      │    │
     Yes   No
      │    │
      │    └──────┐
      │           │
      ▼           ▼
┌─────────┐  ┌──────────┐
│ 200 OK  │  │ 403      │
│ with    │  │ Forbidden│
│ user    │  │          │
│ data    │  │          │
└─────────┘  └──────────┘
```

---

## Project Structure

```
tabiheim/
├── apps/
│   ├── web/                          # React Router web application
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── AuthButton.tsx    # Auth UI component
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts           # Auth helper functions
│   │   │   │   └── supabase.ts       # Supabase client
│   │   │   └── routes/
│   │   │       ├── home.tsx          # Public homepage with auth demo
│   │   │       ├── dashboard.tsx     # Protected route example
│   │   │       └── counter.tsx       # Public counter demo
│   │   ├── .dev.vars                 # Environment variables
│   │   └── AUTH_GUIDE.md             # Web app auth documentation
│   │
│   └── api-worker/                   # Cloudflare Workers API
│       ├── src/
│       │   ├── lib/
│       │   │   ├── auth.ts           # JWT verification helpers
│       │   │   └── supabase.ts       # Supabase client for Workers
│       │   ├── middleware/
│       │   │   └── auth.ts           # Auth middleware (requireAuth, optionalAuth)
│       │   └── index.ts              # API routes & protected endpoints
│       ├── supabase/
│       │   ├── config.toml           # Supabase local config
│       │   └── migrations/
│       │       ├── 00001_create_counter_table.sql
│       │       └── 00002_seed_test_users.sql  # Test users
│       ├── .dev.vars                 # Environment variables
│       └── AUTH_GUIDE.md             # API auth documentation
│
└── AUTH_IMPLEMENTATION.md            # This file - overview
```

### Key Files

#### Web App
- **`app/lib/auth.ts`** - Authentication helper functions
- **`app/components/AuthButton.tsx`** - Sign-in/sign-out UI
- **`app/routes/dashboard.tsx`** - Protected route example
- **`app/routes/home.tsx`** - Public route with auth demo

#### API Worker
- **`src/lib/auth.ts`** - JWT verification functions
- **`src/middleware/auth.ts`** - Hono authentication middleware
- **`src/index.ts`** - API endpoints including protected routes

---

## Setup & Installation

### Prerequisites

- Node.js 18+ and pnpm
- Supabase CLI (`npm install -g supabase`)
- Cloudflare Wrangler (`npm install -g wrangler`)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd tabiheim

# Install dependencies
pnpm install
```

### 2. Start Supabase Locally

```bash
# Navigate to API worker directory
cd apps/api-worker

# Start Supabase (first time)
npx supabase start

# Note the output - you'll need these values:
# - API URL: http://127.0.0.1:54321
# - anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - Inbucket URL: http://127.0.0.1:54324 (for viewing emails)
```

### 3. Configure Environment Variables

#### Web App (`apps/web/.dev.vars`)

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
```

#### API Worker (`apps/api-worker/.dev.vars`)

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 4. Apply Database Migrations

```bash
# From apps/api-worker directory
npx supabase db reset

# This will:
# - Create the database schema
# - Seed test users (test1@example.com, test2@example.com, demo@example.com)
```

### 5. Start Development Servers

```bash
# Terminal 1 - API Worker
cd apps/api-worker
pnpm dev
# Runs on http://localhost:8787

# Terminal 2 - Web App
cd apps/web
pnpm dev
# Runs on http://localhost:5173
```

### 6. Test the Setup

1. **Open web app**: http://localhost:5173
2. **Sign in with test user**: Enter `test1@example.com` in the sign-in form
3. **Check Inbucket**: Open http://localhost:54324 to see the magic link email
4. **Click the magic link**: You'll be redirected back and automatically signed in
5. **Test protected endpoint**: Click "Test Protected API Endpoint" button on homepage

---

## How It Works

### Magic Link Authentication

1. **User enters email** on web app
2. **Web app calls** `signInWithMagicLink(email)` from `app/lib/auth.ts`
3. **Supabase Auth** generates a one-time token and sends email with magic link
4. **User clicks link** in email
5. **User is redirected** to web app with token in URL (`#access_token=...`)
6. **Supabase client** detects token in URL and creates session
7. **Session is stored** in localStorage
8. **User is authenticated** ✓

### JWT Token Flow

1. **User signs in** → Session created with JWT access token
2. **Web app stores** token in localStorage
3. **Web app makes API request** with token in `Authorization: Bearer <token>` header
4. **API middleware** extracts and verifies token using Supabase
5. **If valid** → User object attached to request context → Request proceeds
6. **If invalid** → 401/403 error returned → Request blocked

### Session Persistence

- **Storage**: localStorage (key: `supabase.auth.token`)
- **Lifetime**: Tokens expire after 1 hour (configurable)
- **Refresh**: Automatic before expiration
- **Cross-tab**: Synced across browser tabs
- **Sign-out**: Clears localStorage and invalidates session

---

## Testing Guide

### Test Users

The migration `00002_seed_test_users.sql` creates these test users:

| Email | Purpose | User ID |
|-------|---------|---------|
| `test1@example.com` | Primary test user | `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` |
| `test2@example.com` | Secondary test user | `b1ffcd99-9c1b-4ef8-bb6d-6bb9bd380a22` |
| `demo@example.com` | Demo account | `c2ffcd99-9c2b-4ef8-bb6d-6bb9bd380a33` |

### Manual Testing Steps

#### 1. Test Sign-In Flow

```bash
# 1. Open web app
open http://localhost:5173

# 2. Enter test email
# Type: test1@example.com

# 3. Click "Send Magic Link"

# 4. Check Inbucket for email
open http://localhost:54324

# 5. Click the magic link in the email

# 6. Verify you're signed in
# Should see: "Signed in as: test1@example.com"
```

#### 2. Test Protected API Endpoint

```bash
# Without authentication (should return 403)
curl http://localhost:8787/api/v1/protected/test

# Expected response:
# {
#   "error": "Forbidden",
#   "message": "Authentication required...",
#   "authenticated": false
# }

# With authentication (should return 200)
# First, get token from web app:
# 1. Sign in on web app
# 2. Open browser console
# 3. Run: (await supabase.auth.getSession()).data.session.access_token
# 4. Copy the token

TOKEN="<your-token-here>"

curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8787/api/v1/protected/test

# Expected response:
# {
#   "success": true,
#   "message": "Welcome back, test1@example.com! 🎉",
#   "authenticated": true,
#   "user": { ... }
# }
```

#### 3. Test Protected Route

```bash
# 1. Open dashboard (not signed in)
open http://localhost:5173/dashboard

# Expected: "Authentication Required" message

# 2. Go to homepage and sign in
open http://localhost:5173

# 3. Sign in with test1@example.com

# 4. Navigate to dashboard
# Click "Protected Dashboard" button or go to /dashboard

# Expected: Dashboard with user information
```

### Automated Testing

#### Web App Tests

```typescript
// apps/web/app/lib/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest';
import { signInWithMagicLink, getCurrentUser } from '../auth';

describe('Authentication', () => {
  it('sends magic link for valid email', async () => {
    const result = await signInWithMagicLink('test@example.com');
    expect(result.success).toBe(true);
  });

  it('returns null for unauthenticated user', async () => {
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});
```

#### API Worker Tests

```typescript
// apps/api-worker/src/__tests__/protected.test.ts
import { describe, it, expect } from 'vitest';
import app from '../index';

describe('Protected Endpoint', () => {
  it('returns 403 without token', async () => {
    const res = await app.request('/api/v1/protected/test');
    expect(res.status).toBe(403);
  });

  it('returns 200 with valid token', async () => {
    const token = '<valid-jwt-token>';
    const res = await app.request('/api/v1/protected/test', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});
```

---

## Security Considerations

### JWT Token Security

✅ **DO:**
- Store tokens in httpOnly cookies (production) or localStorage (acceptable for demo)
- Validate tokens on every API request
- Use short-lived tokens (1 hour)
- Implement automatic token refresh
- Clear tokens on sign-out
- Use HTTPS in production

❌ **DON'T:**
- Expose tokens in URLs or logs
- Store tokens in plain JavaScript variables
- Share tokens between users
- Use tokens without expiration
- Skip token verification
- Send tokens over HTTP

### CORS Configuration

The API worker uses strict CORS settings:

```typescript
cors({
  origin: ['http://localhost:5173', ...], // Whitelist specific origins
  allowHeaders: ['Content-Type', 'Authorization'], // Only needed headers
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Allow cookies
})
```

### Row Level Security (RLS)

Supabase uses PostgreSQL Row Level Security to protect data:

```sql
-- Example: Users can only read their own data
CREATE POLICY "Users can view own data"
ON user_data
FOR SELECT
USING (auth.uid() = user_id);
```

### Rate Limiting

Consider implementing rate limiting:
- Limit authentication attempts per IP
- Limit API requests per user
- Use Cloudflare Workers rate limiting
- Monitor for suspicious activity

---

## Troubleshooting

### Common Issues

#### 1. Magic Link Not Working

**Problem**: Clicking magic link doesn't sign in

**Solutions:**
- Check redirect URL in `apps/api-worker/supabase/config.toml`
- Verify `site_url` matches your web app URL
- Check `additional_redirect_urls` includes all dev URLs
- Ensure `detectSessionInUrl: true` in Supabase client config

#### 2. Token Verification Fails

**Problem**: API returns 401 even with valid token

**Solutions:**
- Verify `SUPABASE_URL` matches in both web app and API
- Check `SUPABASE_ANON_KEY` is correct
- Ensure Supabase is running (`npx supabase status`)
- Check token expiration (tokens expire after 1 hour)

#### 3. CORS Errors

**Problem**: Browser blocks API requests

**Solutions:**
- Add web app URL to CORS origins in `apps/api-worker/src/index.ts`
- Include `Authorization` in `allowHeaders`
- Check browser console for specific CORS error
- Test with curl to bypass CORS

#### 4. Session Not Persisting

**Problem**: User is signed out on page reload

**Solutions:**
- Check `persistSession: true` in Supabase client config
- Verify localStorage is enabled in browser
- Check for browser privacy settings blocking localStorage
- Look for errors in browser console

---

## Environment Configuration

### Local Development

#### Web App
```env
# apps/web/.dev.vars
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Worker
```env
# apps/api-worker/.dev.vars
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Production

Use Cloudflare Workers secrets and environment variables:

```bash
# Set production secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

---

## Additional Resources

### Documentation
- [Web App Authentication Guide](apps/web/AUTH_GUIDE.md)
- [API Worker Authentication Guide](apps/api-worker/AUTH_GUIDE.md)
- [Counter Feature Documentation](COUNTER_FEATURE.md)

### External Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Introduction](https://jwt.io/introduction)
- [Hono Documentation](https://hono.dev)
- [React Router Documentation](https://reactrouter.com)

---

## Summary

This authentication implementation provides:

✅ **Passwordless Authentication** - Magic links via Supabase Auth
✅ **JWT Token Verification** - Secure API authentication
✅ **Session Management** - Automatic persistence and refresh
✅ **Protected Routes** - Easy route protection in web app
✅ **Protected Endpoints** - Middleware-based API protection
✅ **Test Users** - Pre-seeded users for development
✅ **Comprehensive Documentation** - Guides for web app and API

The system is production-ready with proper security practices, error handling, and user experience considerations.

