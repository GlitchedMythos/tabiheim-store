# Magic Link Authentication Debugging Guide

## Issue
Clicking the magic link doesn't log you in automatically.

## Solution Steps

### Step 1: Clean Up Docker Containers

First, stop all Supabase containers:

```bash
# On Windows, open PowerShell or Command Prompt
cd apps/api-worker

# Stop Supabase
npx supabase stop

# Clean up any stale Docker containers
docker ps -a | findstr supabase
# If you see any containers, remove them:
docker rm -f <container-id>

# Or remove all stopped containers:
docker container prune -f
```

### Step 2: Restart Supabase with Fresh Config

```bash
# Still in apps/api-worker directory
npx supabase start

# Watch for the output and confirm these URLs:
# - API URL: http://127.0.0.1:54321
# - Inbucket URL: http://127.0.0.1:54324
# - Studio URL: http://127.0.0.1:54323
```

### Step 3: Reset Database with Test Users

```bash
# Apply migrations and seed test users
npx supabase db reset
```

### Step 4: Verify Configuration

Check that your `.dev.vars` files have the correct URLs:

**apps/web/.dev.vars:**
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
```

**apps/api-worker/.dev.vars:**
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 5: Test the Magic Link Flow

1. **Start the web app:**
   ```bash
   cd apps/web
   pnpm dev
   ```
   Should run on http://localhost:5173

2. **Start the API worker:**
   ```bash
   cd apps/api-worker
   pnpm dev
   ```
   Should run on http://localhost:8787

3. **Test authentication:**
   - Open http://localhost:5173
   - Open browser DevTools → Console tab (to see debug logs)
   - Enter email: `test1@example.com`
   - Click "Send Magic Link"
   - Open http://localhost:54324 (Inbucket)
   - Click the magic link in the email

4. **Watch the browser console - you should see:**
   ```
   Auth state changed: SIGNED_IN test1@example.com
   ✅ User signed in successfully: test1@example.com
   ```

## Debugging Checklist

### ✅ If It Works:
- You'll see "Signed in as: test1@example.com" in the AuthButton
- Browser console shows "Auth state changed: SIGNED_IN"
- The "Test Protected API Endpoint" button will return 200 with user data

### ❌ If It Doesn't Work:

#### Check 1: Magic Link URL
Open Inbucket (http://localhost:54324) and check the magic link URL:
- Should look like: `http://localhost:5173/#access_token=...&type=magiclink`
- If it shows `http://127.0.0.1:3000` or another URL, the redirect config is wrong

#### Check 2: Browser Console Errors
Open browser DevTools → Console:
- Look for any Supabase errors
- Look for CORS errors
- Check if "Auth state changed" appears

#### Check 3: Network Tab
Open browser DevTools → Network tab:
- Filter by "Fetch/XHR"
- Look for requests to `127.0.0.1:54321/auth/v1/`
- Check if any requests are failing (red)

#### Check 4: localStorage
Open browser DevTools → Application → Local Storage → http://localhost:5173:
- Should see key: `supabase.auth.token`
- Should have a value after clicking magic link
- If empty, session is not being stored

## Common Issues & Fixes

### Issue: "Site URL not allowed"
**Cause:** Supabase config doesn't include your web app URL

**Fix:**
1. Edit `apps/api-worker/supabase/config.toml`
2. Ensure `site_url = "http://localhost:5173"` or `"http://127.0.0.1:5173"`
3. Restart Supabase: `npx supabase db reset`

### Issue: Magic link redirects to wrong URL
**Cause:** Magic link was generated before config update

**Fix:**
1. Restart Supabase to apply new config
2. Request a new magic link (old ones use old config)
3. Check Inbucket to see the new URL

### Issue: "Auth state changed" never fires
**Cause:** Supabase client not detecting URL hash

**Fix:**
1. Check that URL after clicking magic link has `#access_token=...`
2. Verify `detectSessionInUrl: true` in `apps/web/app/lib/supabase.ts`
3. Check browser console for errors

### Issue: Session not persisting after page reload
**Cause:** localStorage not enabled or session not being stored

**Fix:**
1. Check `persistSession: true` in Supabase client config
2. Verify localStorage is enabled in browser
3. Check browser privacy settings (incognito mode blocks localStorage)

## Manual Verification

### Test 1: Check Supabase Auth
```bash
# Get a session token manually
curl -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"test1@example.com","password":"testpassword123"}'
```

### Test 2: Check API Authentication
```bash
# Test without token (should return 403)
curl http://localhost:8787/api/v1/protected/test

# Test with token (should return 200)
TOKEN="<your-token-from-web-app>"
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8787/api/v1/protected/test
```

## Still Not Working?

1. **Check Supabase logs:**
   ```bash
   cd apps/api-worker
   npx supabase status
   docker logs supabase_auth_api-worker
   ```

2. **Verify test users exist:**
   Open http://127.0.0.1:54323 (Supabase Studio)
   - Go to Authentication → Users
   - Should see test1@example.com, test2@example.com, demo@example.com

3. **Check email is being sent:**
   - Open http://localhost:54324 (Inbucket)
   - Should see an email after requesting magic link
   - If no email appears, check Supabase logs

4. **Try different email:**
   - Use test2@example.com or demo@example.com
   - Request new magic link
   - Check if different user works

## Expected Flow

```
1. Enter email → "Magic link sent!"
2. Check Inbucket → See email
3. Click magic link → Redirects to http://localhost:5173/#access_token=...
4. Page loads → Browser console shows "Auth state changed: SIGNED_IN"
5. AuthButton updates → Shows "Signed in as: test1@example.com"
6. localStorage → Contains supabase.auth.token
7. ✅ Authenticated!
```

## Need More Help?

Check these files:
- `apps/web/AUTH_GUIDE.md` - Web app auth guide
- `apps/api-worker/AUTH_GUIDE.md` - API auth guide
- `AUTH_IMPLEMENTATION.md` - Architecture overview

