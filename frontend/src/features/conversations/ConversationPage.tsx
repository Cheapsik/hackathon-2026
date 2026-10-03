import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import {
  getGetApiConversationsConversationIdQueryKey,
  useGetApiConversationsConversationId,
  usePostApiProblemReportsProblemReportIdMarkAnswered,
  type ConversationProblemReportResponse,
  type ConversationResponse,
} from '@/api/generated/castor'
import { ConversationThread } from '@/features/conversations/ConversationThread'
import { conversationKindLabels } from '@/features/conversations/labels'
import { StatusTimeline } from '@/features/problem-reports/StatusTimeline'
import {
  Badge,
  CeramicCard,
  ErrorState,
  LoadingState,
  SoftButton,
} from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

/** One thread for a signed-in participant: what it is about, and its messages. */
export function ConversationPage() {
  const { conversationId = '' } = useParams()
  const conversation = useGetApiConversationsConversationId(conversationId)
  const item = conversation.data?.data
  const title = item ? conversationTitle(item) : 'Wątek'
  usePageTitle(title)

  return (
    <div className="grid gap-6">
      <SoftButton asChild variant="ghost" icon={<ArrowLeft aria-hidden />}>
        <Link to="/watki">Moje wątki</Link>
      </SoftButton>

      {conversation.isPending && <LoadingState label="Wczytuję wątek…" />}
      {conversation.isError && (
        <>
          <h1 className="font-display text-page-title tracking-display">Wątek</h1>
          <ErrorState
            description={errorMessage(conversation.error, {
              404: 'Nie ma takiego wątku albo nie masz do niego dostępu.',
            })}
            onRetry={() => {
              void conversation.refetch()
            }}
          />
        </>
      )}
      {item && (
        <>
          <header className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{conversationKindLabels[item.kind] ?? item.kind}</Badge>
            </div>
            <h1 className="font-display text-page-title tracking-display">{title}</h1>
          </header>
          <ConversationContext conversation={item} />
          <ConversationThread conversationId={item.id} headingLevel={2} />
        </>
      )}
    </div>
  )
}

function conversationTitle(conversation: ConversationResponse): string {
  if (conversation.problemReport) {
    return `Zgłoszenie ${conversation.problemReport.trackingCode}`
  }

  return conversation.subject ?? conversationKindLabels[conversation.kind] ?? conversation.kind
}

function ConversationContext({ conversation }: { conversation: ConversationResponse }) {
  const kind = conversationKindLabels[conversation.kind] ?? conversation.kind

  if (conversation.problemReport) {
    return <ProblemReportContext conversation={conversation} report={conversation.problemReport} />
  }

  return (
    <CeramicCard padding="lg">
      <p className="text-body text-text-muted">
        {kind}
        {conversation.challengeArea && <> · obszar: {conversation.challengeArea.name}</>}
        {conversation.innovation && (
          <>
            {' · '}
            <Link
              to={`/innowacje/${conversation.innovation.id}`}
              className="font-medium text-text-primary underline-offset-4 hover:underline"
            >
              {conversation.innovation.title}
            </Link>
          </>
        )}
      </p>
    </CeramicCard>
  )
}

function ProblemReportContext({
  conversation,
  report,
}: {
  conversation: ConversationResponse
  report: ConversationProblemReportResponse
}) {
  return (
    <CeramicCard padding="lg" className="grid gap-4">
      <div className="grid gap-2">
        <h2 className="text-section-title font-medium">Zgłoszenie</h2>
        <p className="whitespace-pre-line text-body text-text-primary">{report.description}</p>
      </div>
      <StatusTimeline status={report.status} />
      <div className="flex flex-wrap gap-3">
        {conversation.senderRole === 'ADMIN' && (
          <SoftButton asChild variant="secondary">
            <Link to={`/admin/zgloszenia/${report.id}`}>Otwórz w skrzynce</Link>
          </SoftButton>
        )}
        {conversation.senderRole === 'EXPERT' && report.status === 'WITH_EXPERT' && (
          <MarkAnsweredButton conversationId={conversation.id} problemReportId={report.id} />
        )}
      </div>
    </CeramicCard>
  )
}

/** The expert closes their part: the report moves from "u eksperta" to "odpowiedź" (SPEC §7 V). */
function MarkAnsweredButton({ conversationId, problemReportId }: { conversationId: string; problemReportId: string }) {
  const queryClient = useQueryClient()
  const markAnswered = usePostApiProblemReportsProblemReportIdMarkAnswered()

  function mark() {
    markAnswered.mutate(
      { problemReportId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetApiConversationsConversationIdQueryKey(conversationId) })
        },
      },
    )
  }

  return (
    <div className="grid gap-2">
      <p className="text-body-sm text-text-muted">Gdy odpowiesz w wątku, oznacz zgłoszenie jako odpowiedziane.</p>
      <div className="flex flex-wrap gap-3">
        <SoftButton type="button" variant="primary" loading={markAnswered.isPending} onClick={mark}>
          Oznacz jako odpowiedziane
        </SoftButton>
      </div>
      {markAnswered.isError && (
        <p role="alert" className="text-body-sm text-danger">
          {errorMessage(markAnswered.error)}
        </p>
      )}
    </div>
  )
}
