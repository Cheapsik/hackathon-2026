import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BottomActionDock } from '../primitives/BottomActionDock'
import { IconButton } from '../primitives/IconButton'
import { PageContainer } from '../primitives/PageContainer'
import { TopBar } from '../primitives/TopBar'

export type TransactionStage = 'edit' | 'confirm' | 'success'

export type TransactionTemplateProps = {
  title: ReactNode
  lead?: ReactNode
  onBack?: () => void
  /** Small centred label in the top bar, e.g. the module name. */
  context?: ReactNode
  /** TransactionPanel with the two related fields. */
  panel: ReactNode
  /** Fine print under the panel (data year, assumptions). */
  note?: ReactNode
  /** Primary SoftButton for the current stage. */
  primaryAction?: ReactNode
  dockLeading?: ReactNode
  dockTrailing?: ReactNode
  stage?: TransactionStage
  /** Review shown at `confirm` (ConfirmationPanel tone="review"). */
  confirmation?: ReactNode
  /** Outcome shown at `success` (ConfirmationPanel tone="success"). */
  success?: ReactNode
}

/**
 * Two linked inputs → one result (reference 2's swap screen): centred title, TransactionPanel, fine print and
 * the action in the bottom dock. Stages: edit → confirm → success, each replacing the body.
 */
export function TransactionTemplate({
  title,
  lead,
  onBack,
  context,
  panel,
  note,
  primaryAction,
  dockLeading,
  dockTrailing,
  stage = 'edit',
  confirmation,
  success,
}: TransactionTemplateProps) {
  return (
    <PageContainer width="narrow" className="grid gap-6 pt-4 pb-10">
      {(onBack || context) && (
        <TopBar
          leading={onBack && <IconButton label="Wstecz" icon={ArrowLeft} onClick={onBack} />}
          title={context}
        />
      )}

      {stage === 'success' ? (
        success
      ) : (
        <>
          <header className="grid justify-items-center gap-2 text-center">
            <h1 className="font-display text-page-title tracking-display">{title}</h1>
            {lead && <p className="max-w-80 text-body-sm text-text-muted">{lead}</p>}
          </header>

          <div key={stage} className="grid gap-4 animate-enter">
            {stage === 'confirm' ? confirmation : panel}
            {stage === 'edit' && note && (
              <p className="text-center text-label text-text-muted tabular">{note}</p>
            )}
          </div>

          {primaryAction && (
            <BottomActionDock
              label="Działania"
              primary={primaryAction}
              leading={dockLeading}
              trailing={dockTrailing}
              placement="floating-mobile"
              className="mt-6"
            />
          )}
        </>
      )}
    </PageContainer>
  )
}
