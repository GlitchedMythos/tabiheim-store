# Tabiheim Games

A modern web application built with a serverless-first architecture on Cloudflare's platform.

## Architecture Overview

This project follows a **monorepo structure** using pnpm workspaces, with a clear separation between frontend, backend, and shared code.

### Tech Stack

#### Backend
- **Framework**: [Hono](https://hono.dev) - Lightweight, ultrafast web framework built on Web Standards
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) - Edge-first serverless compute
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Type-safe, lightweight ORM perfect for serverless
- **Database**: [Neon Postgres](https://neon.tech/) - Serverless Postgres with instant branching

#### Frontend
- **Framework**: React 18+ (SPA)
- **Build Tool**: Vite
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)

#### Authentication & Authorization
- **Auth Framework**: [Better-Auth](https://www.better-auth.com/)
- **Enabled Plugins**:
  - **Admin Plugin** - Administrative user management
  - **Organization Plugin** - Multi-tenant organization support with role-based access control
  - **Magic Link Plugin** - Passwordless authentication via email

#### Asset Management
- **Images**: [Cloudflare Images](https://www.cloudflare.com/products/cloudflare-images/) - Optimized image delivery and transformation

## Project Structure

```
tabiheimgames.com/
├── apps/
│   ├── api/                    # Hono backend (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts       # Main worker entry point
│   │   │   ├── auth.ts        # Better-Auth configuration
│   │   │   └── routes/        # API route handlers
│   │   ├── wrangler.toml      # Cloudflare Workers configuration
│   │   ├── drizzle.config.ts  # Drizzle ORM configuration
│   │   └── package.json
│   │
│   └── web/                    # React SPA (Cloudflare Pages)
│       ├── src/
│       │   ├── main.tsx       # Application entry point
│       │   ├── auth.ts        # Better-Auth client
│       │   └── components/    # React components
│       ├── public/            # Static assets
│       ├── vite.config.ts     # Vite configuration
│       └── package.json
│
├── libs/                       # Shared code (created as needed)
│   └── (no premature abstractions - keep code in apps until duplication warrants extraction)
│
├── package.json               # Root workspace configuration
├── pnpm-workspace.yaml        # pnpm workspace definition
└── .cursor/
    └── rules                  # Cursor AI assistance rules
```

### Monorepo Philosophy

**Don't prematurely extract to `libs/`**. Code should initially live in the appropriate app (`api` or `web`) and only be moved to `libs/` when:
1. There's clear duplication across multiple apps
2. The abstraction is stable and well-understood
3. The shared code has a clear, single responsibility

## Key Architectural Decisions

### Why Drizzle ORM?

1. **Serverless-First**: Minimal overhead, perfect for cold starts on Cloudflare Workers
2. **Type-Safe**: Full TypeScript support with excellent type inference
3. **SQL-Like**: Familiar query syntax for developers who know SQL
4. **Neon Integration**: First-class support for Neon's serverless driver (`@neondatabase/serverless`)
5. **Better-Auth Integration**: Official Drizzle adapter provides seamless integration

### Why Better-Auth?

1. **Framework Agnostic**: Works perfectly with Hono on Cloudflare Workers
2. **Plugin Ecosystem**: Rich plugins for common auth patterns (admin, organizations, magic links)
3. **Type-Safe**: Full TypeScript support
4. **Cloudflare Compatible**: Explicit support for Cloudflare Workers runtime
5. **Modern**: Built for modern auth patterns (passwordless, multi-tenant, RBAC)

### Why Cloudflare Workers?

1. **Edge Performance**: Code runs closer to users globally
2. **Cost-Effective**: Generous free tier, pay-per-use pricing
3. **Developer Experience**: Fast local development with Wrangler
4. **Integrated Platform**: Seamless integration with Pages, Images, R2, D1, KV
5. **Web Standards**: Built on standard Web APIs

## Database Setup

### Drizzle + Neon Configuration

The project uses **Drizzle ORM** with the **Neon serverless driver** for optimal performance on Cloudflare Workers.

#### Key Dependencies

```json
{
  "@neondatabase/serverless": "^0.x.x",
  "drizzle-orm": "^0.x.x",
  "drizzle-kit": "^0.x.x"
}
```

#### Drizzle Configuration (`apps/api/drizzle.config.ts`)

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

#### Connection Setup

Use the Neon serverless driver for optimal cold start performance:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// In your Cloudflare Worker
const sql = neon(c.env.DATABASE_URL);
const db = drizzle(sql);
```

#### Migration Workflow

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate:pg

# Apply migrations (run this once per environment)
pnpm drizzle-kit push:pg

# Open Drizzle Studio for database exploration
pnpm drizzle-kit studio
```

### Better-Auth Schema Integration

Better-Auth automatically manages its own tables. When using the **Drizzle adapter**, Better-Auth's schema integrates seamlessly with your Drizzle schema.

**Important**: Use the **Drizzle adapter** (not the raw Postgres adapter) for Better-Auth because:
- Better type inference and safety
- Seamless integration with your Drizzle schema
- Consistent tooling across the application
- All Better-Auth features are fully supported

## Authentication Setup

### Better-Auth with Drizzle

Better-Auth is configured in `apps/api/src/auth.ts` using the Drizzle database adapter.

#### Required Cloudflare Workers Configuration

Better-Auth uses AsyncLocalStorage, which requires the following in `wrangler.toml`:

```toml
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-09-23"
```

#### Server Configuration Example

```typescript
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/neon-http";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzle(c.env.DATABASE_URL),

  emailAndPassword: {
    enabled: false, // Using magic link instead
  },

  plugins: [
    // Admin Plugin - User management and administrative functions
    admin(),

    // Organization Plugin - Multi-tenant organizations with RBAC
    organization({
      roles: {
        admin: ['create', 'read', 'update', 'delete'],
        member: ['read', 'update'],
      },
    }),

    // Magic Link Plugin - Passwordless authentication
    magicLink({
      async sendMagicLink({ email, url, token }) {
        // Send email via your email provider (Resend, SendGrid, etc.)
        await sendEmail({
          to: email,
          subject: "Sign in to Tabiheim Games",
          html: `Click here to sign in: ${url}`,
        });
      },
      expiresIn: 300, // 5 minutes
      disableSignUp: false,
    }),
  ],
});
```

#### Client Configuration Example

```typescript
import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "https://api.tabiheimgames.com", // Your API URL

  plugins: [
    adminClient(),
    organizationClient(),
    magicLinkClient(),
  ],
});
```

### Authentication Flow

1. **Magic Link Sign-In**:
   - User enters email
   - Server sends magic link via email
   - User clicks link → automatically signed in

2. **Organization Access**:
   - Users can belong to multiple organizations
   - Each organization has its own roles and permissions
   - Organization context is maintained in the session

3. **Admin Functions**:
   - Admin users can manage other users
   - Create, update, and delete user accounts
   - Assign roles and permissions

## Deployment

### API (Cloudflare Workers)

```bash
cd apps/api
pnpm run deploy
```

The API is deployed to Cloudflare Workers and accessible at your configured worker domain.

### Web (Cloudflare Pages)

```bash
cd apps/web
pnpm run build
pnpm run deploy
```

The frontend is deployed to Cloudflare Pages with automatic preview deployments for pull requests.

### Environment Variables

#### API (`apps/api`)
- `DATABASE_URL` - Neon Postgres connection string
- `BETTER_AUTH_SECRET` - Secret key for Better-Auth (generate with: `openssl rand -base64 32`)
- `CLOUDFLARE_IMAGES_ACCOUNT_ID` - Cloudflare account ID for Images
- `CLOUDFLARE_IMAGES_API_TOKEN` - API token for Cloudflare Images

#### Web (`apps/web`)
- `VITE_API_URL` - API base URL (e.g., `https://api.tabiheimgames.com`)

## Development

### Prerequisites

- Node.js 20+
- pnpm 10+
- Cloudflare account (free tier works)
- Neon account (free tier works)

### Getting Started

```bash
# Install dependencies
pnpm install

# Start API development server
cd apps/api
pnpm run dev

# In another terminal, start web development server
cd apps/web
pnpm run dev
```

### Local Development with Wrangler

The API uses Wrangler for local development, which provides:
- Hot module reloading
- Local bindings simulation
- Edge runtime environment matching production

## Code Quality

### TypeScript

The project uses strict TypeScript configuration:
- Strict mode enabled
- No implicit any
- Full type inference with Hono and Drizzle

### Linting & Formatting

```bash
# Run ESLint
pnpm run lint

# Format with Prettier
pnpm run format
```

## Resources

- [Hono Documentation](https://hono.dev)
- [Better-Auth Documentation](https://www.better-auth.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Neon Documentation](https://neon.tech/docs)

## License

[Add your license here]

