import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { ClarifyingQuestionResponse } from '@/api/generated/castor'
import { SoftButton, TextAreaField } from '@/design-system'
import { cn } from '@/lib/utils'

interface ClarifyingQuestionsStepProps {
  questions: ClarifyingQuestionResponse[]
  pending: boolean
  /** All answers at once, in the order of the questions; an empty string skips that question. */
  onSubmit: (answers: string[]) => void
  /** The heading level of this block, so it fits the page it is on. */
  headingLevel?: 2 | 3
}

const answerMaxLength = 500

/**
 * Up to three short questions, one at a time, before the platform looks for solutions. The question itself is the
 * field's label, set large; a thin segment per question shows how many are left.
 */
export function ClarifyingQuestionsStep({ questions, pending, onSubmit, headingLevel = 2 }: ClarifyingQuestionsStepProps) {
  const Heading = `h${headingLevel}` as const
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const answerFieldRef = useRef<HTMLTextAreaElement>(null)
  const headingId = useId()
  const isLast = index === questions.length - 1

  // Move focus with the current question so keyboard and screen-reader users stay on the field (WCAG).
  useEffect(() => {
    answerFieldRef.current?.focus()
  }, [index])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isLast) {
      onSubmit(answers)
      return
    }

    setIndex(index + 1)
  }

  function changeAnswer(value: string) {
    setAnswers(answers.map((answer, position) => (position === index ? value : answer)))
  }

  return (
    <section aria-labelledby={headingId} className="grid gap-6">
      <div className="grid gap-2">
        <Heading id={headingId} className="text-section-title font-medium tracking-display">
          Kilka pytań, żeby lepiej dobrać rozwiązania
        </Heading>
        <p className="max-w-default text-body text-text-muted">
          Odpowiedz krótko, własnymi słowami. Każde pytanie możesz pominąć.
        </p>
      </div>

      <form className="grid gap-6 rounded-panel p-5 surface-ceramic surface-field sm:p-7" onSubmit={submit}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-label font-medium text-text-muted tabular">
            Pytanie {index + 1} z {questions.length}
          </p>
          <span aria-hidden className="flex gap-1.5">
            {questions.map((_, position) => (
              <span
                key={position}
                className={cn('h-1 w-8 rounded-button', position <= index ? 'bg-accent' : 'bg-border-subtle')}
              />
            ))}
          </span>
        </div>

        <TextAreaField
          key={index}
          ref={answerFieldRef}
          label={questions[index].question}
          labelSize="lead"
          rows={3}
          maxLength={answerMaxLength}
          value={answers[index]}
          onChange={(event) => changeAnswer(event.target.value)}
          hint={`Do ${answerMaxLength} znaków.`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <SoftButton type="submit" variant="primary" size="lg" forward={isLast} loading={pending}>
            {isLast ? 'Znajdź rozwiązania' : 'Następne pytanie'}
          </SoftButton>
          {index > 0 && (
            <SoftButton type="button" variant="ghost" disabled={pending} onClick={() => setIndex(index - 1)}>
              Poprzednie pytanie
            </SoftButton>
          )}
          <SoftButton type="button" variant="ghost" disabled={pending} onClick={() => onSubmit(answers)}>
            Pomiń pytania
          </SoftButton>
        </div>
      </form>
    </section>
  )
}
