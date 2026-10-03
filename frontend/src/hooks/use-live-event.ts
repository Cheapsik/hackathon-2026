import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

interface LiveEventOptions {
  /** Also follows one report by its tracking code (group report:{code}), e.g. on "Śledź zgłoszenie" without an account. */
  followTrackingCode?: string
}

/**
 * Calls the handler with the event's payload whenever the live hub (/hubs/live) sends one of the events. The server
 * decides who hears what (groups admins, user:{id}, experts:{area}, report:{code}); the page only listens. The
 * connection lives as long as the component.
 */
export function useLiveEvent(
  eventNames: string | readonly string[],
  handler: (payload: unknown) => void,
  { followTrackingCode }: LiveEventOptions = {},
) {
  const handlerRef = useRef(handler)
  const eventKey = typeof eventNames === 'string' ? eventNames : eventNames.join(',')

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/live')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    for (const eventName of eventKey.split(',')) {
      connection.on(eventName, (payload: unknown) => handlerRef.current(payload))
    }

    // Groups belong to a connection, so a reconnected one has to follow the report again.
    async function follow() {
      if (followTrackingCode) {
        await connection.invoke('FollowProblemReport', followTrackingCode)
      }
    }

    connection.onreconnected(() => {
      void follow().catch(() => undefined)
    })
    void connection
      .start()
      .then(follow)
      .catch(() => undefined)

    return () => {
      void connection.stop()
    }
  }, [eventKey, followTrackingCode])
}
