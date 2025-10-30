# API Worker Authentication Guide

This guide explains how to implement and use authentication in the Cloudflare Workers API, including JWT verification, middleware usage, and protected endpoints.

## Table of Contents

1. [Overview](#overview)
2. [JWT Token Verification](#jwt-token-verification)
3. [Authentication Middleware](#authentication-middleware)
4. [Protected Endpoints](#protected-endpoints)
5. [Code Examples](#code-examples)
6. [Testing](#testing)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The API worker uses **JWT (JSON Web Token)** authentication to secure endpoints. Tokens are issued by Supabase Auth and verified on the server using the Supabase client.

### Authentication Flow

```
┌──────────────┐
│  Web Client  │
│ (has JWT)    │
└──────┬───────┘
       │ Request with
       │ Authorization: Bearer <JWT>
       ▼
┌──────────────────┐
│  API Worker      │
│  1. Extract JWT  │
│  2. Verify JWT   │
│  3. Get User     │
└──────┬───────────┘
       │
       ▼
   ┌────────┐
   │Success?│
   └───┬────┘
       │
   ┌───┴────┐
   │        │
  Yes       No
   │        │
   ▼        ▼
┌─────┐  ┌──────┐
│ 200 │  │ 401/ │
│ OK  │  │ 403  │
└─────┘  └──────┘
```

### Key Components

- **`src/lib/auth.ts`** - JWT verification helpers
- **`src/middleware/auth.ts`** - Authentication middleware
- **`src/index.ts`** - Protected endpoints

---

## JWT Token Verification

The `src/lib/auth.ts` module provides functions for verifying JWT tokens and extracting user information.

### `verifyAuthToken(token, env)`

Verifies a JWT access token and returns the authenticated user.

```typescript
import { verifyAuthToken } from './lib/auth';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const authResult = await verifyAuthToken(token, env);

if (authResult.success) {
  console.log('User:', authResult.user.email);
} else {
  console.error('Auth failed:', authResult.error);
  console.log('Status code:', authResult.statusCode);
}
```

**Parameters:**
- `token` (string) - The JWT access token
- `env` (Env) - Cloudflare Worker environment bindings

**Returns:**
```typescript
// Success
{
  success: true,
  user: User  // Supabase User object
}

// Failure
{
  success: false,
  error: string,
  statusCode: 401 | 403
}
```

**How It Works:**

1. Creates a Supabase client with your environment credentials
2. Calls `supabase.auth.getUser(token)` to verify the token
3. Validates token signature against Supabase JWT secret
4. Checks token expiration
5. Verifies user account still exists and is active
6. Returns user object or error

**Token Verification Checks:**
- ✅ Valid signature (token not tampered with)
- ✅ Issued by your Supabase project
- ✅ Not expired
- ✅ User account exists
- ✅ User account is active

---

### `extractBearerToken(authHeader)`

Extracts the JWT token from an Authorization header.

```typescript
import { extractBearerToken } from './lib/auth';

const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const token = extractBearerToken(authHeader);

if (token) {
  // Token extracted successfully
  console.log('Token:', token);
} else {
  // Invalid or missing Authorization header
  console.error('No token found');
}
```

**Expected Header Format:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Returns:**
- JWT token string if valid
- `null` if header is missing or malformed

---

### `getAuthenticatedUser(authHeader, env)`

Convenience function that combines extraction and verification.

```typescript
import { getAuthenticatedUser } from './lib/auth';

app.get('/api/v1/profile', async (c) => {
  const authHeader = c.req.header('Authorization');
  const authResult = await getAuthenticatedUser(authHeader, c.env);

  if (!authResult.success) {
    return c.json({ error: authResult.error }, authResult.statusCode);
  }

  return c.json({
    profile: {
      email: authResult.user.email,
      id: authResult.user.id,
    },
  });
});
```

**Parameters:**
- `authHeader` (string | null) - The Authorization header value
- `env` (Env) - Cloudflare Worker environment bindings

**Returns:**
- Same as `verifyAuthToken`

---

## Authentication Middleware

The `src/middleware/auth.ts` module provides Hono middleware for protecting routes.

### `requireAuth` Middleware

Requires authentication for a route. Returns 401/403 if not authenticated.

```typescript
import { requireAuth } from './middleware/auth';

// Protect a single route
app.get('/api/v1/protected/data', requireAuth, async (c) => {
  // User is guaranteed to be authenticated here
  const user = c.get('user');

  return c.json({
    message: 'This is protected data',
    user: { id: user.id, email: user.email },
  });
});
```

**Features:**
- ✅ Extracts and verifies JWT token
- ✅ Returns 401 if token is missing or invalid
- ✅ Returns 403 if token is valid but user not found
- ✅ Attaches user to context via `c.set('user', user)`
- ✅ Continues to next handler if authenticated

**Usage Patterns:**

**Protect Single Route:**
```typescript
app.get('/api/v1/profile', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ email: user.email });
});
```

**Protect Multiple Routes:**
```typescript
// Protect all routes under /api/v1/protected/*
app.use('/api/v1/protected/*', requireAuth);

app.get('/api/v1/protected/profile', async (c) => {
  const user = c.get('user');
  return c.json({ profile: user });
});

app.get('/api/v1/protected/settings', async (c) => {
  const user = c.get('user');
  return c.json({ settings: getUserSettings(user.id) });
});
```

**Error Responses:**

```json
// 401 - Invalid token
{
  "error": "Authentication required",
  "message": "Invalid or expired token",
  "authenticated": false
}

// 403 - User not found
{
  "error": "Authentication required",
  "message": "User not found",
  "authenticated": false
}
```

---

### `optionalAuth` Middleware

Attempts authentication but doesn't block the request if it fails.

```typescript
import { optionalAuth } from './middleware/auth';

app.get('/api/v1/content', optionalAuth, async (c) => {
  const user = c.get('user');

  if (user) {
    // User is authenticated
    return c.json({
      message: `Welcome back, ${user.email}!`,
      content: 'Premium content',
    });
  } else {
    // User is not authenticated
    return c.json({
      message: 'Welcome, guest!',
      content: 'Public content',
    });
  }
});
```

**Features:**
- ✅ Extracts and verifies JWT token if present
- ✅ Attaches user to context if authentication succeeds
- ✅ Does NOT return error if authentication fails
- ✅ Always continues to next handler
- ✅ User is `undefined` in context if not authenticated

**Use Cases:**
- Public endpoints with enhanced features for authenticated users
- Content personalization
- Analytics and tracking
- A/B testing
- Rate limiting (different limits for authenticated vs anonymous)

---

## Protected Endpoints

### Example: Fully Protected Endpoint

```typescript
import { requireAuth } from './middleware/auth';

/**
 * GET /api/v1/user/profile
 * Returns the authenticated user's profile
 * Requires: Valid JWT token
 */
app.get('/api/v1/user/profile', requireAuth, async (c) => {
  const user = c.get('user');

  return c.json({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
  });
});
```

---

### Example: Conditional Protected Endpoint

```typescript
import { optionalAuth } from './middleware/auth';

/**
 * GET /api/v1/articles
 * Returns articles (premium articles only for authenticated users)
 */
app.get('/api/v1/articles', optionalAuth, async (c) => {
  const user = c.get('user');

  if (user) {
    // Return all articles including premium
    const articles = await getAllArticles();
    return c.json({ articles });
  } else {
    // Return only public articles
    const articles = await getPublicArticles();
    return c.json({ articles });
  }
});
```

---

### Example: Role-Based Access Control

```typescript
import { requireAuth } from './middleware/auth';

/**
 * GET /api/v1/admin/users
 * Returns all users (admin only)
 */
app.get('/api/v1/admin/users', requireAuth, async (c) => {
  const user = c.get('user');

  // Check if user has admin role
  const isAdmin = user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    return c.json(
      {
        error: 'Forbidden',
        message: 'Admin access required',
      },
      403
    );
  }

  // User is admin - return user list
  const supabase = createSupabaseClient(c.env, true); // Use service role
  const { data: users } = await supabase.auth.admin.listUsers();

  return c.json({ users });
});
```

---

## Code Examples

### Complete Protected Endpoint

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './middleware/auth';
import { createSupabaseClient } from './lib/supabase';
import type { Env } from './types';
import type { AuthVariables } from './middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Enable CORS with authentication header support
app.use('/*', cors({
  origin: ['http://localhost:5173'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Protected endpoint
app.get('/api/v1/protected/data', requireAuth, async (c) => {
  const user = c.get('user');
  const supabase = createSupabaseClient(c.env);

  // Fetch user-specific data
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({
    user: { id: user.id, email: user.email },
    data,
  });
});

export default app;
```

---

### Manual Token Verification

If you need more control than the middleware provides:

```typescript
import { getAuthenticatedUser } from './lib/auth';

app.post('/api/v1/custom', async (c) => {
  const authHeader = c.req.header('Authorization');
  const authResult = await getAuthenticatedUser(authHeader, c.env);

  if (!authResult.success) {
    // Custom error handling
    if (authResult.statusCode === 401) {
      return c.json({ error: 'Please sign in' }, 401);
    } else {
      return c.json({ error: 'Access denied' }, 403);
    }
  }

  const user = authResult.user;

  // Custom business logic
  if (!user.email_confirmed_at) {
    return c.json({
      error: 'Email not confirmed',
      message: 'Please confirm your email before accessing this resource',
    }, 403);
  }

  // Process request
  return c.json({ success: true });
});
```

---

## Testing

### Testing with curl

**Without Authentication (should return 403):**
```bash
curl http://localhost:8787/api/v1/protected/test
```

**With Authentication:**
```bash
# First, get a token from the web app
# (Sign in and check browser console for token, or check Network tab)

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8787/api/v1/protected/test
```

---

### Testing with JavaScript

```javascript
// Get token from Supabase client in web app
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Make authenticated request
const response = await fetch('http://localhost:8787/api/v1/protected/test', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log('Response:', data);
```

---

### Testing with Postman

1. **Create a new request**
2. **Set method and URL**: `GET http://localhost:8787/api/v1/protected/test`
3. **Add Authorization header**:
   - Go to "Headers" tab
   - Add header: `Authorization`
   - Value: `Bearer <YOUR_JWT_TOKEN>`
4. **Send request**

**Getting a JWT Token:**
1. Sign in to the web app
2. Open browser DevTools → Console
3. Run: `(await supabase.auth.getSession()).data.session.access_token`
4. Copy the token

---

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Protected Endpoint', () => {
  it('returns 403 without token', async () => {
    const res = await app.request('/api/v1/protected/test');
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.authenticated).toBe(false);
  });

  it('returns 200 with valid token', async () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    const res = await app.request('/api/v1/protected/test', {
      headers: {
        'Authorization': `Bearer ${validToken}`,
      },
    });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.authenticated).toBe(true);
    expect(data.user).toBeDefined();
  });

  it('returns 401 with invalid token', async () => {
    const invalidToken = 'invalid.token.here';

    const res = await app.request('/api/v1/protected/test', {
      headers: {
        'Authorization': `Bearer ${invalidToken}`,
      },
    });

    expect(res.status).toBe(401);
  });
});
```

---

## Security Best Practices

### ✅ DO

**Token Verification:**
- Always verify JWT signature
- Check token expiration
- Validate token issuer (Supabase project)
- Verify user still exists and is active

**CORS:**
- Whitelist specific origins (don't use '*')
- Only allow necessary headers
- Limit allowed methods
- Set appropriate max-age for preflight cache

**Error Messages:**
- Don't leak sensitive information in errors
- Use generic messages like "Authentication required"
- Log detailed errors server-side only

**Rate Limiting:**
- Implement rate limiting on protected endpoints
- Use stricter limits for expensive operations
- Consider different limits for authenticated vs anonymous

**Logging:**
- Log authentication attempts
- Log failed authentication attempts
- Don't log JWT tokens
- Log user ID, not sensitive user data

---

### ❌ DON'T

**Token Handling:**
- ❌ Don't log JWT tokens
- ❌ Don't expose tokens in error messages
- ❌ Don't accept tokens from URL parameters
- ❌ Don't use the same token for multiple users
- ❌ Don't skip token verification in production

**CORS:**
- ❌ Don't use `origin: '*'` in production
- ❌ Don't allow all headers
- ❌ Don't disable CORS security

**User Data:**
- ❌ Don't return sensitive user data without authorization
- ❌ Don't trust client-provided user IDs
- ❌ Don't expose internal user IDs or database IDs
- ❌ Don't leak user existence through error messages

---

## Environment Variables

Required environment variables:

```bash
# .dev.vars (local development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get these values:**
1. Local: Run `npx supabase start` and copy the keys from output
2. Production: Get from Supabase dashboard → Settings → API

---

## Troubleshooting

### "Invalid or expired token" Error

**Cause:** Token signature invalid, token expired, or token not from your Supabase project.

**Solutions:**
1. **Check token is not expired:**
   ```typescript
   // Decode token (without verification) to check expiration
   const parts = token.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log('Expires:', new Date(payload.exp * 1000));
   ```

2. **Verify token is from correct Supabase project:**
   - Token should be issued by your `SUPABASE_URL`
   - Check environment variables are set correctly

3. **Get a fresh token:**
   - Sign in again on the web app
   - Web app should automatically refresh expired tokens

---

### CORS Errors

**Symptoms:**
- Browser shows CORS error
- Request fails before reaching handler
- No response from API

**Solutions:**

1. **Check CORS configuration:**
   ```typescript
   app.use('/*', cors({
     origin: ['http://localhost:5173'], // Add your web app URL
     allowHeaders: ['Content-Type', 'Authorization'], // Must include Authorization
     allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   }));
   ```

2. **Verify web app URL matches CORS origin**
3. **Check Authorization header is in allowHeaders**
4. **Test with curl first** (bypasses CORS to verify endpoint works)

---

### "User not found" Error

**Cause:** Token is valid but user account doesn't exist or was deleted.

**Solutions:**
1. **Check user exists in Supabase:**
   ```bash
   # Via Supabase Studio: http://localhost:54323
   # Go to Authentication → Users
   ```

2. **Check user is not banned:**
   - User `banned_until` field should be null

3. **Verify database migrations ran:**
   ```bash
   cd apps/api-worker
   npx supabase db reset
   ```

---

### Middleware Not Working

**Symptoms:**
- User is authenticated but `c.get('user')` is undefined
- Middleware seems to be skipped

**Solutions:**

1. **Check TypeScript types:**
   ```typescript
   // Ensure app is typed correctly
   const app = new Hono<{
     Bindings: Env;
     Variables: AuthVariables
   }>();
   ```

2. **Verify middleware is applied:**
   ```typescript
   // Middleware must come BEFORE route handler
   app.get('/protected', requireAuth, async (c) => {
     // Handler
   });
   ```

3. **Check middleware import:**
   ```typescript
   import { requireAuth } from './middleware/auth'; // Correct
   // Not: import { requireAuth } from './lib/auth'; // Wrong
   ```

---

## Performance Considerations

### Token Verification Cost

Every token verification makes a request to Supabase. Consider:

**Caching (Advanced):**
- Cache valid tokens for a short time (30-60 seconds)
- Use Cloudflare KV or Durable Objects
- Invalidate cache on sign-out

**Rate Limiting:**
- Limit authentication attempts per IP
- Use Cloudflare Workers rate limiting

### Optimization Tips

1. **Batch Requests**: If making multiple authenticated requests, reuse the same token
2. **Token Refresh**: Refresh tokens proactively before expiration
3. **Reduce Auth Overhead**: Use `optionalAuth` for endpoints that don't strictly require auth

---

## Next Steps

- Read the [Web App Authentication Guide](../web/AUTH_GUIDE.md)
- See [AUTH_IMPLEMENTATION.md](../../AUTH_IMPLEMENTATION.md) for architecture overview
- Check [Supabase Auth API documentation](https://supabase.com/docs/reference/javascript/auth-api)
- Learn about [JWT tokens](https://jwt.io/introduction)

