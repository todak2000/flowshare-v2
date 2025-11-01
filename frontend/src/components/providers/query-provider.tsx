'use client';

/**
 * React Query Provider Component
 *
 * This is a Client Component that wraps the QueryClientProvider.
 * It must be a Client Component because QueryClient is a class instance,
 * and Next.js doesn't allow passing classes from Server to Client Components.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside the component to avoid sharing state between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
