import { useQueryClient } from '@tanstack/react-query'
import { getGetApiAuthSessionQueryKey, useGetApiAuthSession, type SessionResponse } from '@/api/generated/castor'

/** Who is signed in. Undefined while the first answer is on its way. */
export function useSession(): SessionResponse | undefined {
  const session = useGetApiAuthSession()

  return session.data?.data
}

/**
 * After sign-in, registration or sign-out every cached answer belongs to the previous user — their reports, their
 * assistant chats — so all of it is dropped, not merely marked stale, and the session is read again.
 */
export function useRefreshSession() {
  const queryClient = useQueryClient()

  return async () => {
    const sessionKey = getGetApiAuthSessionQueryKey()
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] })
    await queryClient.invalidateQueries({ queryKey: sessionKey })
  }
}
