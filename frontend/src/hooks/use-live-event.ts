import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

/**
 * Calls the handler whenever the live hub (/hubs/live) sends the event. The server decides who hears what (groups
 * admins and user:{id}); the page only listens. The connection lives as long as the component.
 */
export function useLiveEvent(eventName: string, handler: () => void) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/live')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on(eventName, () => handlerRef.current())
    void connection.start().catch(() => undefined)

    return () => {
      void connection.stop()
    }
  }, [eventName])
}
