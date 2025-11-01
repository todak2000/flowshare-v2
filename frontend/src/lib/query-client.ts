/**
 * React Query configuration
 *
 * Configures global defaults for data fetching, caching, and refetching.
 * Improves performance by reducing unnecessary network requests.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute
      staleTime: 60 * 1000,

      // Cached data is kept for 5 minutes after becoming unused
      gcTime: 5 * 60 * 1000,

      // Retry failed requests once before giving up
      retry: 1,

      // Don't refetch on window focus to reduce server load
      refetchOnWindowFocus: false,

      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on network errors
      retry: 1,
    },
  },
});
