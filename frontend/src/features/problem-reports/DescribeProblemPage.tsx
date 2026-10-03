import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  usePostApiProblemReports,
  usePostApiProblemReportsProblemReportIdAnswers,
  type MunicipalityResponse,
  type ProblemReportResponse,
} from '@/api/generated/castor'
import { ClarifyingQuestionsStep } from '@/features/problem-reports/ClarifyingQuestionsStep'
import { DictationButton } from '@/features/problem-reports/DictationButton'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import { ProblemReportResults } from '@/features/problem-reports/ProblemReportResults'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

const descriptionMinLength = 20
const descriptionMaxLength = 3000

/**
 * Module I, "Opisz problem": one large field, the microphone, an optional gmina and "on behalf of someone".
 * Sending creates the report; then come up to three clarifying questions and the matches.
 */
export function DescribeProblemPage() {
  usePageTitle('Opisz problem')

  const [report, setReport] = useState<ProblemReportResponse | null>(null)
  const createReport = usePostApiProblemReports()
  const answerQuestions = usePostApiProblemReportsProblemReportIdAnswers()
  const resultsRef = useRef<HTMLDivElement>(null)

  // The next step takes the focus, so keyboard and screen reader users land where the page changed.
  useEffect(() => {
    if (report) {
      resultsRef.current?.focus()
    }
  }, [report])

  function submitAnswers(answers: string[]) {
    if (!report) {
      return
    }

    answerQuestions.mutate(
      { problemReportId: report.id, data: { answers }, headers: { 'X-Tracking-Code': report.trackingCode } },
      { onSuccess: (response) => setReport(response.data) },
    )
  }

  return (
    <>
      <h1>Opisz problem</h1>
      <p>
        Napisz własnymi słowami, co nie działa w Twojej okolicy. Podpowiemy sprawdzone innowacje społeczne z Biblioteki
        ROPS i wyjaśnimy, dlaczego pasują. Nie musisz zakładać konta.
      </p>

      {!report && (
        <DescribeProblemForm
          pending={createReport.isPending}
          onSubmit={(request) => createReport.mutate({ data: request }, { onSuccess: (response) => setReport(response.data) })}
        />
      )}

      <div aria-live="polite">
        {createReport.isPending && <p><output>Szukam rozwiązań… To może potrwać kilka sekund.</output></p>}
        {answerQuestions.isPending && <p><output>Szukam rozwiązań na podstawie Twoich odpowiedzi…</output></p>}
      </div>
      {createReport.isError && (
        <p role="alert">
          {errorMessage(createReport.error, {
            400: `Sprawdź opis: musi mieć od ${descriptionMinLength} do ${descriptionMaxLength} znaków.`,
          })}
        </p>
      )}
      {answerQuestions.isError && <p role="alert">{errorMessage(answerQuestions.error)}</p>}

      <div ref={resultsRef} tabIndex={-1}>
        {report?.awaitsAnswers && (
          <ClarifyingQuestionsStep questions={report.clarifyingQuestions} pending={answerQuestions.isPending} onSubmit={submitAnswers} />
        )}
        {report && !report.awaitsAnswers && <ProblemReportResults report={report} headingLevel={2} />}
      </div>
    </>
  )
}

interface DescribeProblemFormRequest {
  description: string
  municipalityTeryt: string | null
  submittedOnBehalf: boolean
  dictated: boolean
  keepOriginalDescription: boolean
}

interface DescribeProblemFormProps {
  pending: boolean
  onSubmit: (request: DescribeProblemFormRequest) => void
}

function DescribeProblemForm({ pending, onSubmit }: DescribeProblemFormProps) {
  const [description, setDescription] = useState('')
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(null)
  const [submittedOnBehalf, setSubmittedOnBehalf] = useState(false)
  const [keepOriginalDescription, setKeepOriginalDescription] = useState(false)
  const [dictated, setDictated] = useState(false)
  const descriptionId = useId()
  const descriptionHintId = useId()

  function appendPhrase(phrase: string) {
    setDictated(true)
    setDescription((current) => (current ? `${current} ${phrase}` : phrase))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      description,
      municipalityTeryt: municipality?.teryt ?? null,
      submittedOnBehalf,
      dictated,
      keepOriginalDescription,
    })
  }

  return (
    <form onSubmit={submit}>
      <p>
        <label htmlFor={descriptionId}>Opisz, co nie działa</label>
      </p>
      <p id={descriptionHintId}>
        Od {descriptionMinLength} do {descriptionMaxLength} znaków. Nie podawaj imion, nazwisk, adresów ani telefonów —
        i tak je usuniemy, zanim opis trafi dalej.
      </p>
      <textarea
        id={descriptionId}
        aria-describedby={descriptionHintId}
        rows={8}
        cols={60}
        required
        minLength={descriptionMinLength}
        maxLength={descriptionMaxLength}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <p>
        Wpisano znaków: {description.length} z {descriptionMaxLength}
      </p>

      <DictationButton onPhrase={appendPhrase} />

      <MunicipalityPicker selected={municipality} onSelect={setMunicipality} />

      <p>
        <label>
          <input type="checkbox" checked={submittedOnBehalf} onChange={(event) => setSubmittedOnBehalf(event.target.checked)} />{' '}
          Zgłaszam w czyimś imieniu
        </label>
      </p>
      <p>
        <label>
          <input
            type="checkbox"
            checked={keepOriginalDescription}
            onChange={(event) => setKeepOriginalDescription(event.target.checked)}
          />{' '}
          Zgadzam się na zapisanie opisu w oryginalnej formie (zobaczy go tylko autor i pracownik ROPS)
        </label>
      </p>

      <button type="submit" disabled={pending}>
        Znajdź rozwiązania
      </button>
    </form>
  )
}
