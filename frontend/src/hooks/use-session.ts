import { useQueryClient } from '@tanstack/react-query'
import {
  getApiAuthSession,
  getGetApiAuthSessionQueryKey,
  useGetApiAuthSession,
  type SessionResponse,
} from '@/api/generated/castor'

/** Who is signed in. Undefined while the first answer is on its way. */
export function useSession(): SessionResponse | undefined {
  const session = useGetApiAuthSession()

  return session.data?.data
}

/** Landing route after sign-in or registration. Admins start in the admin panel. */
export function signedInHomePath(session: SessionResponse | undefined): string {
  if (session?.role === 'ADMIN') {
    return '/admin'
  }

  return '/moje-zgloszenia'
}

/**
 * After sign-in, registration or sign-out every cached answer belongs to the previous user — their reports, their
 * assistant chats — so all of it is dropped, not merely marked stale, and the session is read again.
 */
export function useRefreshSession() {
  const queryClient = useQueryClient()

  return async (): Promise<SessionResponse | undefined> => {
    const sessionKey = getGetApiAuthSessionQueryKey()
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] })
    const response = await queryClient.fetchQuery({
      queryKey: sessionKey,
      queryFn: ({ signal }) => getApiAuthSession({ signal }),
    })
    return response.data
  }
}
