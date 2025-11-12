import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance for use in loaders and components.
 * This ensures we have a single cache that can be accessed both
 * in React Router loaders and React Query hooks.
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  // Server-side: always create a new QueryClient
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  // Client-side: create the QueryClient once and reuse it
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return browserQueryClient;
}

