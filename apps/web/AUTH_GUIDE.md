# Web App Authentication Guide

This guide explains how authentication works in the Tabiheim web application, including implementation details, usage examples, and troubleshooting tips.

## Table of Contents

1. [Overview](#overview)
2. [Magic Link Authentication](#magic-link-authentication)
3. [Authentication Helpers](#authentication-helpers)
4. [AuthButton Component](#authbutton-component)
5. [Protected Routes](#protected-routes)
6. [Session Management](#session-management)
7. [API Integration](#api-integration)
8. [Code Examples](#code-examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The web app uses **Supabase Auth** for passwordless authentication via **magic links**. This provides a secure, user-friendly authentication experience without requiring users to remember passwords.

### Key Features

- 🔐 **Passwordless Authentication** - Users sign in by clicking a magic link sent to their email
- 🎯 **Automatic Session Management** - Sessions are automatically persisted in localStorage
- 🔄 **Token Auto-Refresh** - JWT tokens refresh automatically before expiration
- 🚀 **Protected Routes** - Easy route protection with authentication checks
- 🔗 **API Integration** - JWT tokens for authenticated API requests

### Technology Stack

- **Supabase JS Client** (`@supabase/supabase-js`) - Authentication SDK
- **React Router** - Routing and navigation
- **React** - UI components and state management
- **localStorage** - Session persistence

---

## Magic Link Authentication

Magic link authentication is a passwordless sign-in method where users receive a one-time link via email. Clicking the link automatically signs them in.

### How It Works

```
┌─────────────┐
│ User enters │
│   email     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Magic link sent │
│   to email      │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ User clicks link │
└──────┬───────────┘
       │
       ▼
┌────────────────────┐
│ Automatically      │
│ signed in          │
│ Session created    │
└────────────────────┘
```

### Advantages

- ✅ No password to remember
- ✅ No password reset flows needed
- ✅ Secure (one-time use, expires after 1 hour)
- ✅ Easy user experience
- ✅ Mobile-friendly

### Local Development

In local development, emails are captured by **Inbucket** instead of being sent to real email addresses.

- **Inbucket URL**: http://localhost:54324
- Access this URL to see all sent emails and click the magic links

---

## Authentication Helpers

The `app/lib/auth.ts` file provides helper functions for authentication operations.

### `signInWithMagicLink(email: string)`

Sends a magic link to the user's email address.

```typescript
import { signInWithMagicLink } from '~/lib/auth';

const result = await signInWithMagicLink('user@example.com');

if (result.success) {
  console.log('Magic link sent!');
  // Show success message to user
} else {
  console.error('Error:', result.error);
  // Show error message to user
}
```

**Parameters:**
- `email` (string) - User's email address

**Returns:**
- `AuthResult` object with `success`, `message`, and optional `error`

**Example Response:**
```json
{
  "success": true,
  "message": "Magic link sent! Check your email to sign in."
}
```

---

### `signOut()`

Signs out the current user and clears the session.

```typescript
import { signOut } from '~/lib/auth';

const result = await signOut();

if (result.success) {
  // Redirect to home page
  window.location.href = '/';
}
```

**Returns:**
- `AuthResult` object with `success` and optional `error`

---

### `getCurrentUser()`

Gets the currently authenticated user object.

```typescript
import { getCurrentUser } from '~/lib/auth';

const user = await getCurrentUser();

if (user) {
  console.log('Logged in as:', user.email);
  console.log('User ID:', user.id);
} else {
  console.log('Not logged in');
}
```

**Returns:**
- `User` object if authenticated
- `null` if not authenticated

**User Object Structure:**
```typescript
{
  id: string;              // Unique user ID (UUID)
  email: string;           // User's email address
  created_at: string;      // Account creation timestamp
  last_sign_in_at: string; // Last sign-in timestamp
  user_metadata: object;   // Custom user data
  app_metadata: object;    // System metadata
}
```

---

### `getSession()`

Gets the current authentication session including the JWT token.

```typescript
import { getSession } from '~/lib/auth';

const session = await getSession();

if (session) {
  console.log('Access Token:', session.access_token);
  console.log('Expires At:', new Date(session.expires_at * 1000));
}
```

**Returns:**
- `Session` object if authenticated
- `null` if not authenticated

**Session Object Structure:**
```typescript
{
  access_token: string;    // JWT token for API authentication
  refresh_token: string;   // Token for refreshing expired access tokens
  expires_at: number;      // Unix timestamp of token expiration
  expires_in: number;      // Seconds until token expires
  token_type: string;      // Always "bearer"
  user: User;              // User object
}
```

---

### `getAccessToken()`

Convenience function to get just the JWT access token.

```typescript
import { getAccessToken } from '~/lib/auth';

const token = await getAccessToken();

if (token) {
  // Use token for API requests
  const response = await fetch('http://localhost:8787/api/v1/protected/test', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

---

### `isAuthenticated()`

Quick check for authentication status.

```typescript
import { isAuthenticated } from '~/lib/auth';

const isLoggedIn = await isAuthenticated();

if (!isLoggedIn) {
  // Redirect to login
  window.location.href = '/';
}
```

---

### `onAuthStateChange(callback)`

Listen for authentication state changes (sign in, sign out, token refresh).

```typescript
import { onAuthStateChange } from '~/lib/auth';

// In a React component
useEffect(() => {
  const unsubscribe = onAuthStateChange((event, session) => {
    console.log('Auth event:', event);

    if (event === 'SIGNED_IN') {
      console.log('User signed in:', session?.user.email);
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  });

  // Cleanup on unmount
  return () => unsubscribe();
}, []);
```

**Events:**
- `SIGNED_IN` - User successfully signed in
- `SIGNED_OUT` - User signed out
- `TOKEN_REFRESHED` - Access token was refreshed
- `USER_UPDATED` - User profile was updated

---

## AuthButton Component

The `AuthButton` component (`app/components/AuthButton.tsx`) provides a complete authentication UI that automatically adapts to the user's authentication state.

### Features

- ✅ Magic link sign-in form for unauthenticated users
- ✅ User info display for authenticated users
- ✅ Sign-out button
- ✅ Real-time state updates
- ✅ Loading states and error handling
- ✅ Success messages
- ✅ Test user hints for development

### Usage

```tsx
import { AuthButton } from '~/components/AuthButton';

function MyPage() {
  return (
    <div>
      <h1>Welcome</h1>
      <AuthButton />
    </div>
  );
}
```

### States

**Not Authenticated:**
- Shows email input field
- "Send Magic Link" button
- Hint about test users
- Link to Inbucket for local dev

**Authenticated:**
- Displays user's email
- User avatar icon
- "Sign Out" button

**Loading:**
- Spinner animation
- Disabled buttons
- "Sending..." or "Signing out..." text

---

## Protected Routes

Protected routes require authentication. Users who are not logged in see a sign-in prompt.

### Example: Dashboard Route

```tsx
// app/routes/dashboard.tsx
import { useState, useEffect } from 'react';
import { getCurrentUser } from '~/lib/auth';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>Authentication Required</h1>
        <p>Please sign in to access this page.</p>
        <Link to="/">Go to Home & Sign In</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <p>This is a protected page.</p>
    </div>
  );
}
```

### Protection Pattern

1. **Check authentication on mount** - Use `useEffect` to check auth status
2. **Show loading state** - Display loading indicator while checking
3. **Redirect if not authenticated** - Show sign-in prompt or redirect
4. **Render protected content** - Show content only if authenticated

---

## Session Management

Sessions are automatically managed by the Supabase client.

### Persistence

- Sessions are stored in **localStorage** under the key `supabase.auth.token`
- Sessions persist across page reloads and browser tabs
- Sessions survive browser restarts

### Token Refresh

- Access tokens expire after **1 hour** (configurable in Supabase)
- Tokens are **automatically refreshed** before expiration
- Refresh happens in the background without user interaction
- If refresh fails, user is automatically signed out

### Manual Session Check

```typescript
import { getSession } from '~/lib/auth';

const session = await getSession();

if (!session) {
  console.log('No active session');
} else {
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();

  console.log(`Token expires in ${Math.floor(timeUntilExpiry / 1000)} seconds`);
}
```

---

## API Integration

JWT tokens are used to authenticate requests to protected API endpoints.

### Making Authenticated API Requests

```typescript
import { getAccessToken } from '~/lib/auth';

async function callProtectedEndpoint() {
  // Get the JWT token
  const token = await getAccessToken();

  if (!token) {
    console.error('No authentication token available');
    return;
  }

  // Make authenticated request
  const response = await fetch('http://localhost:8787/api/v1/protected/test', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('API request failed:', response.status);
    return;
  }

  const data = await response.json();
  console.log('API response:', data);
}
```

### Headers Format

The JWT token must be sent in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error Handling

```typescript
try {
  const token = await getAccessToken();

  const response = await fetch('http://localhost:8787/api/v1/protected/test', {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  if (response.status === 401) {
    console.error('Unauthorized - invalid or expired token');
    // Redirect to sign-in
  } else if (response.status === 403) {
    console.error('Forbidden - authentication required');
    // Show sign-in prompt
  } else if (!response.ok) {
    console.error('API error:', response.status);
  } else {
    const data = await response.json();
    console.log('Success:', data);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Code Examples

### Complete Sign-In Flow

```tsx
import { useState } from 'react';
import { signInWithMagicLink } from '~/lib/auth';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await signInWithMagicLink(email);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setEmail('');
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
      {message && (
        <div className={message.type}>
          {message.text}
        </div>
      )}
    </form>
  );
}
```

### Protected Component

```tsx
import { useState, useEffect } from 'react';
import { getCurrentUser } from '~/lib/auth';

function ProtectedContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return <p>Please sign in to view this content.</p>;
  }

  return (
    <div>
      <h2>Protected Content</h2>
      <p>Welcome, {user.email}!</p>
    </div>
  );
}
```

---

## Troubleshooting

### Magic Link Not Arriving

**In Local Development:**
- Check Inbucket at http://localhost:54324
- Emails are captured locally and don't go to real inboxes
- Make sure Supabase is running (`npx supabase start`)

**In Production:**
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email rate limits
- Verify SMTP configuration in Supabase dashboard

---

### Session Not Persisting

**Check localStorage:**
```javascript
// In browser console
console.log(localStorage.getItem('supabase.auth.token'));
```

If null, session is not being saved. Possible causes:
- localStorage is disabled or full
- Browser is in private/incognito mode
- Third-party cookies are blocked

**Solution:**
- Enable localStorage
- Use regular browser mode
- Check browser privacy settings

---

### Token Expired Error

Tokens expire after 1 hour. They should auto-refresh, but if they don't:

```typescript
import { supabase } from '~/lib/supabase';

// Force refresh session
const { data, error } = await supabase.auth.refreshSession();

if (error) {
  console.error('Refresh failed:', error);
  // Sign out and prompt user to sign in again
}
```

---

### CORS Errors

If you see CORS errors when making API requests:

1. **Check API is running** - `http://localhost:8787`
2. **Verify CORS config** - API should allow your web app origin
3. **Check headers** - Ensure `Authorization` header is allowed
4. **Browser console** - Look for specific CORS error messages

---

### Auth State Not Updating

If the UI doesn't update after sign-in/sign-out:

```tsx
import { useEffect } from 'react';
import { onAuthStateChange } from '~/lib/auth';

useEffect(() => {
  const unsubscribe = onAuthStateChange((event, session) => {
    // Force component re-render
    setUser(session?.user || null);
  });

  return () => unsubscribe();
}, []);
```

---

## Environment Variables

Required environment variables for the web app:

```env
# .env or .dev.vars
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** In Vite/React Router, environment variables must be prefixed with `VITE_`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Security Best Practices

### ✅ DO

- Store JWT tokens in memory or httpOnly cookies (current: localStorage)
- Validate tokens on every API request
- Use HTTPS in production
- Implement token refresh logic
- Handle token expiration gracefully
- Clear tokens on sign-out

### ❌ DON'T

- Expose JWT tokens in URLs or logs
- Store tokens in plain JavaScript variables (XSS risk)
- Send tokens over HTTP (use HTTPS)
- Hardcode tokens in source code
- Share tokens between users
- Use the same token forever (implement refresh)

---

## Next Steps

- Read the [API Worker Authentication Guide](../../api-worker/AUTH_GUIDE.md)
- See [AUTH_IMPLEMENTATION.md](../../AUTH_IMPLEMENTATION.md) for architecture overview
- Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)

