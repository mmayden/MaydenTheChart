/**
 * TanStack Query v5 client configuration.
 * - staleTime: 30s — don't refetch bars more than once every 30 seconds
 * - retry: 1 — one retry on failure, then show error state
 * - refetchOnWindowFocus: 'always' — refresh data when user returns to tab
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           30 * 1000,  // 30 seconds
      retry:               1,
      refetchOnWindowFocus: 'always',
      refetchInterval:     false,
    },
  },
})
