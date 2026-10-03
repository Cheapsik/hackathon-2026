import { useQueryClient } from '@tanstack/react-query'
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
    <>
      <p>
        <Link to="/watki">Wróć do wątków</Link>
      </p>
      {conversation.isPending && (
        <p>
          <output>Wczytuję wątek…</output>
        </p>
      )}
      {conversation.isError && (
        <>
          <h1>Wątek</h1>
          <p role="alert">{errorMessage(conversation.error, { 404: 'Nie ma takiego wątku albo nie masz do niego dostępu.' })}</p>
        </>
      )}
      {item && (
        <>
          <h1>{title}</h1>
          <ConversationContext conversation={item} />
          <ConversationThread conversationId={item.id} headingLevel={2} />
        </>
      )}
    </>
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
    <p>
      {kind}
      {conversation.challengeArea && <>, obszar wyzwań: {conversation.challengeArea.name}</>}
      {conversation.innovation && (
        <>
          : <Link to={`/innowacje/${conversation.innovation.id}`}>{conversation.innovation.title}</Link>
        </>
      )}
      .
    </p>
  )
}

function ProblemReportContext({ conversation, report }: { conversation: ConversationResponse; report: ConversationProblemReportResponse }) {
  return (
    <section aria-labelledby="report-title">
      <h2 id="report-title">Zgłoszenie</h2>
      <p>{report.description}</p>
      <StatusTimeline status={report.status} />
      {conversation.senderRole === 'ADMIN' && (
        <p>
          <Link to={`/admin/zgloszenia/${report.id}`}>Otwórz zgłoszenie w skrzynce</Link>
        </p>
      )}
      {conversation.senderRole === 'EXPERT' && report.status === 'WITH_EXPERT' && (
        <MarkAnsweredButton conversationId={conversation.id} problemReportId={report.id} />
      )}
    </section>
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
    <>
      <p>Gdy odpowiesz w wątku, oznacz zgłoszenie jako odpowiedziane.</p>
      <p>
        <button type="button" onClick={mark} disabled={markAnswered.isPending}>
          Oznacz jako odpowiedziane
        </button>
      </p>
      <div aria-live="polite">
        {markAnswered.isError && (
          <p role="alert">{errorMessage(markAnswered.error, { 409: 'Zgłoszenie nie jest już u eksperta.' })}</p>
        )}
      </div>
    </>
  )
}
