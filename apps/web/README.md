# Tabiheim Games - Web App

React SPA built with Vite, deployed to Cloudflare Pages.

## Tech Stack

- **React 18+** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing (SPA mode)
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
├── main.tsx              # Entry point
├── App.tsx               # Root component with providers
├── routes/               # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Dashboard.tsx
├── lib/                  # Utilities and configuration
│   ├── auth.ts          # Better-Auth client
│   └── router.tsx       # React Router configuration
└── components/          # Reusable components
    └── ProtectedRoute.tsx
```

## Authentication

Authentication is handled by Better-Auth client, connecting to the API at `/api/*`. The dev server proxies API requests to `http://localhost:8787`.

## Routes

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)

