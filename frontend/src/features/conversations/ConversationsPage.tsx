import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  getGetApiConversationsQueryKey,
  useGetApiConversations,
  type ConversationSummaryResponse,
} from '@/api/generated/castor'
import { conversationKindLabels } from '@/features/conversations/labels'
import { statusLabel } from '@/features/problem-reports/status-labels'
import { usePageTitle } from '@/hooks/use-page-title'
import { useLiveEvent } from '@/hooks/use-live-event'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** Threads the signed-in user takes part in, the most recently active first (SPEC §7 V). */
export function ConversationsPage() {
  usePageTitle('Moje wątki')
  const session = useSession()

  if (session && !session.signedIn) {
    return (
      <>
        <h1>Moje wątki</h1>
        <p>
          <Link to="/logowanie">Zaloguj się</Link>, żeby zobaczyć swoje rozmowy. Rozmowę o zgłoszeniu wysłanym bez konta
          znajdziesz na stronie <Link to="/sledz">Śledź zgłoszenie</Link>.
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Moje wątki</h1>
      <p>
        Masz pytanie do ekspertów z jednego z obszarów wyzwań? <Link to="/zapytaj-eksperta">Zapytaj eksperta</Link>.
      </p>
      <ConversationList />
    </>
  )
}

function ConversationList() {
  const queryClient = useQueryClient()
  const conversations = useGetApiConversations()
  const items = conversations.data?.data ?? []

  useLiveEvent('MessagePosted', () => {
    void queryClient.invalidateQueries({ queryKey: getGetApiConversationsQueryKey() })
  })

  return (
    <section aria-labelledby="conversations-title">
      <h2 id="conversations-title">Rozmowy</h2>
      <div aria-live="polite">
        {conversations.isPending && (
          <p>
            <output>Wczytuję rozmowy…</output>
          </p>
        )}
        {conversations.isError && <p role="alert">{errorMessage(conversations.error)}</p>}
        {conversations.isSuccess && items.length === 0 && <p>Nie masz jeszcze żadnych rozmów.</p>}
      </div>
      {items.length > 0 && (
        <table>
          <caption>Twoje rozmowy, od ostatnio aktywnej</caption>
          <thead>
            <tr>
              <th scope="col">Rozmowa</th>
              <th scope="col">Rodzaj</th>
              <th scope="col">Ostatnia wiadomość</th>
            </tr>
          </thead>
          <tbody>
            {items.map((conversation) => (
              <tr key={conversation.id}>
                <td>
                  <Link to={`/watki/${conversation.id}`}>{conversationTitle(conversation)}</Link>
                </td>
                <td>{conversationContext(conversation)}</td>
                <td>{conversation.lastMessageAt ? formatDateTime(conversation.lastMessageAt) : 'brak'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function conversationTitle(conversation: ConversationSummaryResponse): string {
  if (conversation.problemReportTrackingCode) {
    return `Zgłoszenie ${conversation.problemReportTrackingCode}`
  }

  return conversation.subject ?? conversationKindLabels[conversation.kind] ?? conversation.kind
}

function conversationContext(conversation: ConversationSummaryResponse): string {
  const kind = conversationKindLabels[conversation.kind] ?? conversation.kind
  if (conversation.problemReportStatus) {
    return `${kind}, status: ${statusLabel(conversation.problemReportStatus)}`
  }

  if (conversation.challengeAreaName) {
    return `${kind}, obszar: ${conversation.challengeAreaName}`
  }

  if (conversation.innovationTitle) {
    return `${kind}: ${conversation.innovationTitle}`
  }

  return kind
}
