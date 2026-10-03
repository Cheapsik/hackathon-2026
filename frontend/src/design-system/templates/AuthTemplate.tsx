import type { ReactNode } from 'react'
import { CeramicCard } from '../primitives/CeramicCard'
import { PageContainer } from '../primitives/PageContainer'

export type AuthTemplateProps = {
  /** Small brand mark above the title. */
  brand?: ReactNode
  title: ReactNode
  lead?: ReactNode
  /** The form; one dominant action inside it. */
  children: ReactNode
  /** Switch between sign-in and registration, help links. */
  footer?: ReactNode
}

/** Sign in, register, reset: one focused column, a small brand mark, a ceramic form, no dashboard chrome. */
export function AuthTemplate({ brand, title, lead, children, footer }: AuthTemplateProps) {
  return (
    <div className="grid min-h-[75dvh] place-items-center py-10">
      <PageContainer width="narrow" className="grid gap-6">
        <header className="grid justify-items-center gap-3 text-center">
          {brand}
          <h1 className="font-display text-page-title tracking-display">{title}</h1>
          {lead && <p className="max-w-80 text-body-sm text-text-muted">{lead}</p>}
        </header>
        <CeramicCard padding="none" className="grid gap-5 p-5 md:p-6">
          {children}
        </CeramicCard>
        {footer && <div className="text-center text-body-sm text-text-muted">{footer}</div>}
      </PageContainer>
    </div>
  )
}
