import { useState, type FormEvent } from 'react'
import type { ClarifyingQuestionResponse } from '@/api/generated/castor'
import { CeramicCard, SoftButton, TextAreaField } from '@/design-system'

interface ClarifyingQuestionsStepProps {
  questions: ClarifyingQuestionResponse[]
  pending: boolean
  /** All answers at once, in the order of the questions; an empty list skips them. */
  onSubmit: (answers: string[]) => void
}

const answerMaxLength = 500

/** Up to three short questions, one at a time, before the platform looks for solutions. */
export function ClarifyingQuestionsStep({ questions, pending, onSubmit }: ClarifyingQuestionsStepProps) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const isLast = index === questions.length - 1

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
    <CeramicCard padding="lg" className="max-w-default grid gap-4">
      <div className="grid gap-2">
        <h2 className="text-section-title font-medium">Kilka pytań, żeby lepiej dobrać rozwiązania</h2>
        <p className="text-body-sm text-text-muted">
          Pytanie {index + 1} z {questions.length}. Możesz odpowiedzieć krótko albo pominąć pytanie.
        </p>
      </div>
      <form className="grid gap-4" onSubmit={submit}>
        <TextAreaField
          key={index}
          label={questions[index].question}
          rows={3}
          maxLength={answerMaxLength}
          value={answers[index]}
          autoFocus
          onChange={(event) => changeAnswer(event.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <SoftButton type="submit" variant="primary" loading={pending}>
            {isLast ? 'Znajdź rozwiązania' : 'Następne pytanie'}
          </SoftButton>
          <SoftButton type="button" variant="ghost" disabled={pending} onClick={() => onSubmit([])}>
            Pomiń pytania
          </SoftButton>
        </div>
      </form>
    </CeramicCard>
  )
}
