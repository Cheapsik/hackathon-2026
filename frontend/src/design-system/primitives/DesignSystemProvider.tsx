import type { ReactNode } from 'react'
import { Tooltip } from 'radix-ui'
import { ToastProvider } from './Toast'

/** Context the primitives need (tooltips, toasts). Mounted once in main.tsx. */
export function DesignSystemProvider({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
      <ToastProvider>{children}</ToastProvider>
    </Tooltip.Provider>
  )
}
