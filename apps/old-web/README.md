# Tabiheim Games - Web App

React SPA built with React Router Framework Mode, deployed to Cloudflare Pages.

## Tech Stack

- **React 19** - UI framework
- **React Router 7** - Framework Mode with SPA routing
- **Vite** - Build tool and dev server (via React Router plugin)
- **Mantine UI** - Component library
- **TanStack Query** - Data fetching and state management
- **Better-Auth** - Authentication client
- **TypeScript** - Type safety
- **Cloudflare Pages** - Hosting and deployment

## Development

```bash
# Install dependencies (from project root)
pnpm install

# Start dev server
pnpm --filter web dev

# Build for production
pnpm --filter web build

# Preview production build
pnpm --filter web preview

# Type checking
pnpm --filter web type-check
```

## Environment Variables

Copy `.dev.vars.example` to `.dev.vars` and configure:

```
VITE_API_URL=http://localhost:8787
```

## Deployment

Deploy to Cloudflare Pages:

```bash
cd apps/web
pnpm run deploy
```

Or deploy via the Cloudflare Pages dashboard by connecting to your Git repository.

## Project Structure

```
src/
├── entry.client.tsx      # Client hydration entry point
├── entry.server.tsx      # Server entry (build-time only in SPA mode)
├── root.tsx              # Root layout with providers
├── routes.ts             # Route configuration
├── routes/               # Route modules (file-based)
│   ├── home.tsx          # / - redirects to login
│   ├── login.tsx         # /login
│   ├── register.tsx      # /register
│   └── dashboard.tsx     # /dashboard (protected)
└── lib/                  # Utilities and configuration
    └── auth.ts           # Better-Auth client
```

## React Router Framework Mode

This app uses **React Router 7 in Framework Mode with SPA** (`ssr: false`). Key features:

- **File-based routing** - Routes defined in `src/routes.ts` pointing to route modules
- **Type-safe routes** - Auto-generated types via `react-router typegen`
- **Optimized builds** - Automatic code-splitting and lazy loading
- **SPA deployment** - No server-side rendering at runtime
- **Framework benefits** - Access to loaders, actions, and other framework features (client-side only)

### Configuration Files

- `react-router.config.ts` - React Router configuration (appDirectory, ssr: false)
- `vite.config.ts` - Uses `@react-router/dev/vite` plugin
- `src/routes.ts` - Route definitions using file-based routing API

## Authentication

Authentication is handled by Better-Auth client, connecting to the API at `/api/*`. The dev server proxies API requests to `http://localhost:8787`.

Protected routes check authentication directly in the route component.

## Routes

- `/` - Home (redirects to /login)
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)



