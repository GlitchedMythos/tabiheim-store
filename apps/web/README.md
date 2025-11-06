# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root of this directory with the following variables:

```bash
# API URL for Better-Auth client
VITE_API_URL=http://localhost:8787
```

See `.env.local.example` for a template.

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Previewing the Production Build

Preview the production build locally:

```bash
npm run preview
```

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

Deployment is done using the Wrangler CLI.

To build and deploy directly to production:

```sh
npm run deploy
```

To deploy a preview URL:

```sh
npx wrangler versions upload
```

You can then promote a version to production after verification or roll it out progressively.

```sh
npx wrangler versions deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## Authentication

This application uses [Better-Auth](https://www.better-auth.com/) for authentication with magic link (passwordless) sign-in.

### Features

- 🔐 **Magic Link Authentication**: No passwords required - users receive a secure link via email
- 👤 **User Management**: Built-in user session management
- 🏢 **Organizations**: Multi-tenant support with role-based access control (RBAC)
- 🛡️ **Protected Routes**: Dashboard and other routes are protected by authentication

### Routes

- `/` - Home page with magic link login form
- `/dashboard` - Protected dashboard (requires authentication)

### How It Works

1. User enters their email on the home page
2. Backend sends a magic link to the user's email
3. User clicks the link and is authenticated
4. User is redirected to the dashboard
5. Session is maintained using cookies

---

Built with ❤️ using React Router.
