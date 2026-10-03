import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/castor-fetch'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A refusal (4xx) will not change on retry; a network or server failure might.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) {
          return false
        }

        return failureCount < 2
      },
    },
  },
})
