import { useDeferredValue, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CircleHelp, MessagesSquare } from 'lucide-react'
import { Link } from 'react-router'
import {
  getGetApiConversationsQueryKey,
  useGetApiConversations,
  type ConversationSummaryResponse,
} from '@/api/generated/castor'
import { conversationKindLabels } from '@/features/conversations/labels'
import { problemReportStatusLabels, statusLabel } from '@/features/problem-reports/status-labels'
import {
  Badge,
  CeramicCard,
  EmptyState,
  ErrorState,
  LoadingState,
  SearchAndFilters,
  SelectField,
  SoftButton,
  type BadgeProps,
} from '@/design-system'
import { useLiveEvent } from '@/hooks/use-live-event'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { errorMessage } from '@/lib/error-message'
import { timeSince } from '@/lib/format'

const kindOptions = Object.entries(conversationKindLabels).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(problemReportStatusLabels).map(([value, label]) => ({ value, label }))

function statusTone(status: string): BadgeProps['tone'] {
  switch (status) {
    case 'ANSWERED':
      return 'success'
    case 'IN_ANALYSIS':
    case 'WITH_EXPERT':
      return 'warning'
    case 'CLOSED':
      return 'neutral'
    default:
      return 'strong'
  }
}

function conversationTitle(conversation: ConversationSummaryResponse): string {
  if (conversation.problemReportTrackingCode) {
    return `Zgłoszenie ${conversation.problemReportTrackingCode}`
  }

  return conversation.subject ?? conversationKindLabels[conversation.kind] ?? conversation.kind
}

function conversationSubtitle(conversation: ConversationSummaryResponse): string {
  if (conversation.challengeAreaName) {
    return conversation.challengeAreaName
  }
  if (conversation.innovationTitle) {
    return conversation.innovationTitle
  }
  if (conversation.subject && conversation.problemReportTrackingCode) {
    return conversation.subject
  }
  return conversationKindLabels[conversation.kind] ?? conversation.kind
}

/** Threads the signed-in user takes part in, the most recently active first (SPEC §7 V). */
export function ConversationsPage() {
  usePageTitle('Moje wątki')
  const session = useSession()

  if (!session) {
    return <LoadingState label="Sprawdzam sesję…" />
  }

  if (!session.signedIn) {
    return (
      <div className="grid gap-8">
        <header className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Moje wątki</h1>
          <p className="text-body text-text-muted">
            Po zalogowaniu zobaczysz rozmowy o zgłoszeniach, pytaniach do ekspertów i współpracy przy innowacjach.
          </p>
        </header>
        <EmptyState
          title="Zaloguj się, żeby zobaczyć wątki"
          description="Rozmowę o zgłoszeniu wysłanym bez konta znajdziesz na stronie Śledź zgłoszenie."
          icon={MessagesSquare}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <SoftButton asChild variant="primary">
                <Link to="/logowanie">Zaloguj się</Link>
              </SoftButton>
              <SoftButton asChild>
                <Link to="/sledz">Śledź zgłoszenie</Link>
              </SoftButton>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div className="grid max-w-default gap-2">
          <h1 className="font-display text-page-title tracking-display">Moje wątki</h1>
          <p className="text-body text-text-muted">
            Rozmowy o zgłoszeniach, pytaniach do ekspertów i współpracy przy innowacjach - od ostatnio aktywnej.
          </p>
        </div>
        <SoftButton asChild variant="primary" icon={<CircleHelp aria-hidden />}>
          <Link to="/zapytaj-eksperta">Zapytaj eksperta</Link>
        </SoftButton>
      </header>
      <ConversationList />
    </div>
  )
}

function ConversationList() {
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const queryClient = useQueryClient()
  const conversations = useGetApiConversations()

  const rows = useMemo(() => {
    let list = conversations.data?.data ?? []
    if (kind) {
      list = list.filter((conversation) => conversation.kind === kind)
    }
    if (status) {
      list = list.filter((conversation) => conversation.problemReportStatus === status)
    }
    if (deferredSearch) {
      list = list.filter((conversation) => {
        const haystack = [
          conversationTitle(conversation),
          conversation.subject,
          conversation.problemReportTrackingCode,
          conversation.challengeAreaName,
          conversation.innovationTitle,
          conversationKindLabels[conversation.kind],
          conversation.problemReportStatus ? statusLabel(conversation.problemReportStatus) : null,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(deferredSearch)
      })
    }
    return list
  }, [conversations.data?.data, deferredSearch, kind, status])

  const pageStatus =
    conversations.isPending && !conversations.data
      ? 'loading'
      : conversations.isError
        ? 'error'
        : rows.length === 0
          ? 'empty'
          : 'ready'

  useLiveEvent('MessagePosted', () => {
    void queryClient.invalidateQueries({ queryKey: getGetApiConversationsQueryKey() })
  })
  useLiveEvent('ProblemReportStatusChanged', () => {
    void queryClient.invalidateQueries({ queryKey: getGetApiConversationsQueryKey() })
  })

  return (
    <div className="grid gap-6">
      <SearchAndFilters
        searchLabel="Szukaj po temacie, kodzie albo obszarze"
        placeholder="np. CAS-2026 albo seniorzy"
        query={search}
        onQueryChange={setSearch}
        searching={conversations.isFetching}
        resultSummary={
          conversations.isFetching
            ? 'Odświeżam…'
            : pageStatus === 'ready'
              ? `Wątki: ${rows.length}`
              : pageStatus === 'empty'
                ? 'Brak wątków dla wybranych filtrów.'
                : null
        }
        filters={
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Rodzaj"
              value={kind}
              placeholder="wszystkie rodzaje"
              options={kindOptions}
              onChange={(event) => setKind(event.target.value)}
            />
            <SelectField
              label="Status zgłoszenia"
              value={status}
              placeholder="wszystkie statusy"
              options={statusOptions}
              onChange={(event) => setStatus(event.target.value)}
            />
          </div>
        }
      />

      {pageStatus === 'loading' && <LoadingState label="Wczytuję rozmowy…" />}
      {pageStatus === 'error' && (
        <ErrorState
          description={errorMessage(conversations.error)}
          onRetry={() => {
            void conversations.refetch()
          }}
        />
      )}
      {pageStatus === 'empty' && (
        <EmptyState
          title="Brak wątków"
          description={
            deferredSearch || kind || status
              ? 'Zmień wyszukiwanie albo filtry.'
              : 'Napisz do ekspertów albo poczekaj na odpowiedź przy zgłoszeniu - wtedy wątek pojawi się tutaj.'
          }
          icon={MessagesSquare}
          action={
            !(deferredSearch || kind || status) ? (
              <SoftButton asChild variant="primary">
                <Link to="/zapytaj-eksperta">Zapytaj eksperta</Link>
              </SoftButton>
            ) : undefined
          }
        />
      )}

      {pageStatus === 'ready' && (
        <CeramicCard asChild padding="none" className="p-1">
          <ul className="grid divide-y divide-border-subtle">
            {rows.map((conversation) => (
              <li key={conversation.id}>
                <div className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid min-w-0 gap-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        to={`/watki/${conversation.id}`}
                        className="font-medium text-text-primary underline-offset-4 hover:underline"
                      >
                        {conversationTitle(conversation)}
                      </Link>
                      <span className="text-label text-text-muted">
                        {conversation.lastMessageAt ? timeSince(conversation.lastMessageAt) : 'brak wiadomości'}
                      </span>
                    </div>
                    <p className="text-body-sm text-text-muted">{conversationSubtitle(conversation)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Badge>{conversationKindLabels[conversation.kind] ?? conversation.kind}</Badge>
                    {conversation.problemReportStatus && (
                      <Badge tone={statusTone(conversation.problemReportStatus)}>
                        {statusLabel(conversation.problemReportStatus)}
                      </Badge>
                    )}
                    <SoftButton asChild variant="secondary">
                      <Link to={`/watki/${conversation.id}`}>Otwórz</Link>
                    </SoftButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CeramicCard>
      )}
    </div>
  )
}
