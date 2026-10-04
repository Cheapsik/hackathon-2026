import { Check } from 'lucide-react'

const steps = ['Opis', 'Pytania', 'Rozwiązania'] as const

/**
 * The three steps of a report on the glass panel: a ring with the number (a check once done), the name and a bar.
 * State is not carried by colour alone: the check, the weight and the hidden words say it too.
 */
export function ReportSteps({ current }: { current: number }) {
  return (
    <ol className="dp-steps" aria-label="Etapy zgłoszenia">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <li key={step} className={done ? 'dp-step is-done' : 'dp-step'} aria-current={active ? 'step' : undefined}>
            <span className="dp-step-name">
              <span className="dp-step-mark" aria-hidden="true">
                {done ? <Check strokeWidth={3} /> : index + 1}
              </span>
              <span>
                {step}
                <span className="dp-sr">{done ? ' (zrobione)' : active ? ' (teraz)' : ''}</span>
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
