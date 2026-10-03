import { useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetApiConversationsConversationIdQueryKey,
  useGetApiConversationsConversationId,
  usePostApiConversationsConversationIdMessages,
  type ConversationResponse,
} from '@/api/generated/castor'
import { senderLabel } from '@/features/conversations/labels'
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
    <section aria-labelledby="thread-title">
      <Heading id="thread-title">Wiadomości</Heading>
      <div aria-live="polite">
        {conversation.isPending && (
          <p>
            <output>Wczytuję wiadomości…</output>
          </p>
        )}
        {conversation.isError && (
          <p role="alert">{errorMessage(conversation.error, { 404: 'Nie masz dostępu do tego wątku.' })}</p>
        )}
        {conversation.isSuccess && <MessageList conversation={conversation.data.data} />}
      </div>
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
    return <p>Nie ma jeszcze wiadomości.</p>
  }

  return (
    <ol>
      {conversation.messages.map((message) => (
        <li key={message.id}>
          <p>
            <strong>{senderLabel(message.senderRole, message.mine, conversation.kind)}</strong>,{' '}
            <time dateTime={message.postedAt}>{formatDateTime(message.postedAt)}</time>
          </p>
          <p className="whitespace-pre-line">{message.text}</p>
        </li>
      ))}
    </ol>
  )
}

function MessageForm({ conversation, trackingCode }: { conversation: ConversationResponse; trackingCode?: string }) {
  const [text, setText] = useState('')
  const queryClient = useQueryClient()
  const post = usePostApiConversationsConversationIdMessages()
  const textId = useId()

  if (!conversation.acceptsMessages) {
    return <p>Zgłoszenie jest zamknięte, więc wątek jest tylko do odczytu.</p>
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
    <form onSubmit={submit}>
      <label htmlFor={textId}>Nowa wiadomość</label>
      <br />
      <textarea
        id={textId}
        rows={5}
        cols={70}
        maxLength={messageMaxLength}
        value={text}
        onChange={(event) => setText(event.target.value)}
        required
      />
      <br />
      <button type="submit" disabled={post.isPending || text.trim().length === 0}>
        Wyślij wiadomość
      </button>
      <div aria-live="polite">
        {post.isSuccess && (
          <p>
            <output>Wiadomość wysłana.</output>
          </p>
        )}
        {post.isError && (
          <p role="alert">
            {errorMessage(post.error, {
              400: `Napisz wiadomość (najwyżej ${messageMaxLength} znaków).`,
              404: 'Nie masz dostępu do tego wątku.',
              409: 'Zgłoszenie jest już zamknięte, więc nie można dopisać wiadomości.',
            })}
          </p>
        )}
      </div>
    </form>
  )
}
