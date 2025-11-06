import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, Scripts, ScrollRestoration } from 'react-router';
import { useState } from 'react';

/**
 * Root Layout Component
 *
 * This is the root layout for the entire application in React Router Framework Mode.
 * It provides all necessary providers and renders child routes via <Outlet />.
 *
 * Providers:
 * - QueryClientProvider: TanStack Query for data fetching
 * - MantineProvider: Mantine UI components and theming
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tabiheim Games</title>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  // Create QueryClient in state to ensure it's created once per app instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Outlet />
      </MantineProvider>
    </QueryClientProvider>
  );
}


