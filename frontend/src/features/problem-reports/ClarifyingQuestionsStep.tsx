import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { ClarifyingQuestionResponse } from '@/api/generated/castor'

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
  const answerId = useId()
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const isLast = index === questions.length - 1

  // Each next question takes the focus, so a screen reader reads it right away.
  useEffect(() => {
    fieldRef.current?.focus()
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
    <section aria-labelledby="clarifying-questions-title">
      <h2 id="clarifying-questions-title">Kilka pytań, żeby lepiej dobrać rozwiązania</h2>
      <p>
        Pytanie {index + 1} z {questions.length}. Możesz odpowiedzieć krótko albo pominąć pytanie.
      </p>
      <form onSubmit={submit}>
        <label htmlFor={answerId}>{questions[index].question}</label>
        <textarea
          id={answerId}
          ref={fieldRef}
          rows={3}
          maxLength={answerMaxLength}
          value={answers[index]}
          onChange={(event) => changeAnswer(event.target.value)}
        />
        <button type="submit" disabled={pending}>
          {isLast ? 'Znajdź rozwiązania' : 'Następne pytanie'}
        </button>{' '}
        <button type="button" disabled={pending} onClick={() => onSubmit([])}>
          Pomiń pytania i pokaż rozwiązania
        </button>
      </form>
    </section>
  )
}
