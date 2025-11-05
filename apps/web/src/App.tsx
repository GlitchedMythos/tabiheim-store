import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/lib/router';
import { useState } from 'react';

/**
 * Root App component
 *
 * Provides:
 * 1. QueryClientProvider - TanStack Query for data fetching
 * 2. MantineProvider - Mantine UI components and theming
 * 3. RouterProvider - React Router for navigation
 */
export function App() {
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
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>
  );
}

