import type { FormEventHandler, ReactNode } from 'react'
import { ArrowLeft, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BottomActionDock } from '../primitives/BottomActionDock'
import { GlassPanel } from '../primitives/GlassPanel'
import { IconButton } from '../primitives/IconButton'
import { PageContainer } from '../primitives/PageContainer'
import { TopBar } from '../primitives/TopBar'

export type FormFlowStep = { current: number; total: number }

export type FormFlowTemplateProps = {
  title: ReactNode
  lead?: ReactNode
  /** Multi-step flows show "Krok 2 z 3" and a progress bar. */
  step?: FormFlowStep
  /** Back to the previous step or page. */
  onBack?: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  /** Fields of the current step (TextField, SelectField, …). */
  children: ReactNode
  /** Optional read-only summary under the fields (DataList in a CeramicCard). */
  summary?: ReactNode
  /** Submit SoftButton (variant="primary" fullWidth type="submit"). */
  primaryAction: ReactNode
  /** Optional icon action left of the primary one. */
  secondaryAction?: ReactNode
  /** Problem with the whole form (e.g. the API refused it). Field errors stay inline on the fields. */
  formError?: ReactNode
}

/**
 * One focused step at a time on a narrow milky surface, with the main action docked at the bottom on phones.
 * Validation is inline: the form uses noValidate and every Field shows its own error.
 */
export function FormFlowTemplate({
  title,
  lead,
  step,
  onBack,
  onSubmit,
  children,
  summary,
  primaryAction,
  secondaryAction,
  formError,
}: FormFlowTemplateProps) {
  return (
    <PageContainer width="narrow" className="grid gap-6 pt-4 pb-10">
      {(onBack || step) && (
        <TopBar
          leading={onBack && <IconButton label="Wstecz" icon={ArrowLeft} onClick={onBack} />}
          title={step && `Krok ${step.current} z ${step.total}`}
        />
      )}

      {step && (
        <progress
          aria-label={`Postęp: krok ${step.current} z ${step.total}`}
          value={step.current}
          max={step.total}
          className={cn(
            'h-1 w-full appearance-none overflow-hidden rounded-button bg-border-subtle',
            '[&::-webkit-progress-bar]:bg-border-subtle [&::-webkit-progress-value]:rounded-button [&::-webkit-progress-value]:bg-surface-active',
            '[&::-moz-progress-bar]:rounded-button [&::-moz-progress-bar]:bg-surface-active',
          )}
        />
      )}

      <header className="grid gap-2">
        <h1 className="font-display text-page-title tracking-display">{title}</h1>
        {lead && <p className="text-body text-text-muted">{lead}</p>}
      </header>

      <form noValidate onSubmit={onSubmit} className="grid gap-6">
        {formError && (
          <div role="alert" className="flex items-start gap-3 rounded-card bg-danger-soft p-4 text-body-sm text-danger">
            <CircleAlert aria-hidden className="mt-px size-icon shrink-0" />
            <div>{formError}</div>
          </div>
        )}

        <GlassPanel asChild>
          <div className="grid gap-5">{children}</div>
        </GlassPanel>

        {summary}

        <BottomActionDock
          label="Działania formularza"
          primary={primaryAction}
          leading={secondaryAction}
          placement="floating-mobile"
        />
      </form>
    </PageContainer>
  )
}
