import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetApiConversationsConversationIdQueryKey,
  useGetApiConversationsConversationId,
  usePostApiConversationsConversationIdMessages,
  type ConversationResponse,
} from '@/api/generated/castor'
import { senderLabel } from '@/features/conversations/labels'
import { CeramicCard, EmptyState, ErrorState, LoadingState, SoftButton, TextAreaField } from '@/design-system'
import { useLiveEvent } from '@/hooks/use-live-event'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

/** The same limit as the API's (Message.Text). */
const messageMaxLength = 4000

interface ConversationThreadProps {
  conversationId: string
  /** Opens a report thread without an account: the code works like a password. */
  trackingCode?: string
  headingLevel: 2 | 3
}

/** Messages of one thread and the form for a new one, refreshed live when someone else writes. */
export function ConversationThread({ conversationId, trackingCode, headingLevel }: ConversationThreadProps) {
  const conversation = useLiveConversation(conversationId, trackingCode)
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <section aria-labelledby="thread-title" className="grid gap-4">
      <Heading id="thread-title" className="text-section-title font-medium">
        Wiadomości
      </Heading>
      {conversation.isPending && <LoadingState label="Wczytuję wiadomości…" />}
      {conversation.isError && (
        <ErrorState description={errorMessage(conversation.error, { 404: 'Nie masz dostępu do tego wątku.' })} />
      )}
      {conversation.isSuccess && <MessageList conversation={conversation.data.data} />}
      {conversation.isSuccess && (
        <MessageForm conversation={conversation.data.data} trackingCode={trackingCode} />
      )}
    </section>
  )
}

/** The thread's query, shared with the page around it; refetched when a message or a status change comes in. */
function useLiveConversation(conversationId: string, trackingCode?: string) {
  const queryClient = useQueryClient()
  const headers = trackingCode ? { 'X-Tracking-Code': trackingCode } : undefined
  const conversation = useGetApiConversationsConversationId(conversationId, headers)

  useLiveEvent(
    ['MessagePosted', 'ProblemReportStatusChanged'],
    (payload) => {
      if (isMessageInAnotherConversation(payload, conversationId)) {
        return
      }

      void queryClient.invalidateQueries({ queryKey: getGetApiConversationsConversationIdQueryKey(conversationId) })
    },
    { followTrackingCode: trackingCode },
  )

  return conversation
}

/** An administrator or an expert hears every message in their groups; only this thread's ones matter here. */
function isMessageInAnotherConversation(payload: unknown, conversationId: string): boolean {
  if (typeof payload !== 'object' || payload === null || !('conversationId' in payload)) {
    return false
  }

  return payload.conversationId !== conversationId
}

function MessageList({ conversation }: { conversation: ConversationResponse }) {
  if (conversation.messages.length === 0) {
    return <EmptyState title="Nie ma jeszcze wiadomości" description="Napisz pierwszą wiadomość poniżej." />
  }

  return (
    <CeramicCard asChild padding="none" className="p-1">
      <ol className="grid divide-y divide-border-subtle">
        {conversation.messages.map((message) => (
          <li key={message.id} className="grid gap-2 px-3 py-3">
            <p className="text-label text-text-muted">
              <span className="font-medium text-text-primary">
                {senderLabel(message.senderRole, message.mine, conversation.kind)}
              </span>
              {' · '}
              <time dateTime={message.postedAt}>{formatDateTime(message.postedAt)}</time>
            </p>
            <p className="whitespace-pre-line text-body text-text-primary">{message.text}</p>
          </li>
        ))}
      </ol>
    </CeramicCard>
  )
}

function MessageForm({ conversation, trackingCode }: { conversation: ConversationResponse; trackingCode?: string }) {
  const [text, setText] = useState('')
  const queryClient = useQueryClient()
  const post = usePostApiConversationsConversationIdMessages()

  if (!conversation.acceptsMessages) {
    return (
      <p className="rounded-control bg-surface-glass-strong p-3 text-body-sm text-text-muted">
        Zgłoszenie jest zamknięte, więc wątek jest tylko do odczytu.
      </p>
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    post.mutate(
      {
        conversationId: conversation.id,
        data: { text },
        headers: trackingCode ? { 'X-Tracking-Code': trackingCode } : undefined,
      },
      {
        onSuccess: (response) => {
          setText('')
          queryClient.setQueryData(getGetApiConversationsConversationIdQueryKey(conversation.id), response)
        },
      },
    )
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextAreaField
        label="Nowa wiadomość"
        rows={5}
        maxLength={messageMaxLength}
        value={text}
        required
        onChange={(event) => setText(event.target.value)}
        hint={`Do ${messageMaxLength} znaków.`}
      />
      <div className="flex flex-wrap gap-3">
        <SoftButton type="submit" variant="primary" loading={post.isPending} disabled={text.trim().length === 0}>
          Wyślij wiadomość
        </SoftButton>
      </div>
      {post.isError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(post.error, {
            400: `Napisz wiadomość (najwyżej ${messageMaxLength} znaków).`,
            404: 'Nie masz dostępu do tego wątku.',
            409: 'Zgłoszenie jest już zamknięte, więc nie można dopisać wiadomości.',
          })}
        </p>
      )}
    </form>
  )
}
