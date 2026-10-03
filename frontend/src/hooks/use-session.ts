import { useQueryClient } from '@tanstack/react-query'
import {
  getGetApiAuthSessionQueryKey,
  getGetApiProblemReportsMineQueryKey,
  useGetApiAuthSession,
  type SessionResponse,
} from '@/api/generated/castor'

/** Who is signed in. Undefined while the first answer is on its way. */
export function useSession(): SessionResponse | undefined {
  const session = useGetApiAuthSession()

  return session.data?.data
}

/** After sign-in, registration or sign-out the session and everything tied to it is read again. */
export function useRefreshSession() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: getGetApiAuthSessionQueryKey() })
    await queryClient.invalidateQueries({ queryKey: getGetApiProblemReportsMineQueryKey() })
  }
}
