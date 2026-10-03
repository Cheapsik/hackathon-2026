import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'
import {
  usePostApiProblemReports,
  usePostApiProblemReportsProblemReportIdAnswers,
  type MunicipalityResponse,
  type ProblemReportResponse,
} from '@/api/generated/castor'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import { ClarifyingQuestionsStep } from '@/features/problem-reports/ClarifyingQuestionsStep'
import { DictationButton } from '@/features/problem-reports/DictationButton'
import { ProblemReportResults } from '@/features/problem-reports/ProblemReportResults'
import { CeramicCard, CheckboxField, SoftButton, TextAreaField } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { errorMessage } from '@/lib/error-message'

type DescribeProblemLocationState = { description?: string } | null

const descriptionMinLength = 20
const descriptionMaxLength = 3000

/**
 * Module I, "Opisz problem": one large field, the microphone, an optional gmina and "on behalf of someone".
 * Sending creates the report; then come up to three clarifying questions and the matches.
 */
export function DescribeProblemPage() {
  usePageTitle('Opisz problem')

  const handedOverDescription = (useLocation().state as DescribeProblemLocationState)?.description?.trim() ?? ''
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
    <div className="grid gap-6">
      <header className="grid max-w-default gap-2">
        <h1 className="font-display text-page-title tracking-display">Opisz problem</h1>
        <p className="text-body text-text-muted">
          Napisz własnymi słowami, co nie działa w Twojej okolicy. Podpowiemy sprawdzone innowacje z Biblioteki ROPS.
          Nie musisz zakładać konta.
        </p>
      </header>

      {!report && (
        <DescribeProblemForm
          pending={createReport.isPending}
          initialDescription={handedOverDescription}
          onSubmit={(request) =>
            createReport.mutate({ data: request }, { onSuccess: (response) => setReport(response.data) })
          }
        />
      )}

      {(createReport.isPending || answerQuestions.isPending) && (
        <p aria-live="polite" className="text-body-sm text-text-muted">
          <output>
            {createReport.isPending
              ? 'Szukam rozwiązań… To może potrwać kilka sekund.'
              : 'Szukam rozwiązań na podstawie Twoich odpowiedzi…'}
          </output>
        </p>
      )}
      {createReport.isError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(createReport.error, {
            400: `Sprawdź opis: musi mieć od ${descriptionMinLength} do ${descriptionMaxLength} znaków.`,
          })}
        </p>
      )}
      {answerQuestions.isError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {errorMessage(answerQuestions.error)}
        </p>
      )}

      <div ref={resultsRef} tabIndex={-1} className="grid gap-6 outline-none">
        {report?.awaitsAnswers && (
          <ClarifyingQuestionsStep
            questions={report.clarifyingQuestions}
            pending={answerQuestions.isPending}
            onSubmit={submitAnswers}
          />
        )}
        {report && !report.awaitsAnswers && <ProblemReportResults report={report} headingLevel={2} />}
      </div>
    </div>
  )
}

interface DescribeProblemFormRequest {
  description: string
  municipalityTeryt: string | null
  submittedOnBehalf: boolean
  dictated: boolean
  keepOriginalDescription: boolean
}

function DescribeProblemForm({
  pending,
  initialDescription,
  onSubmit,
}: {
  pending: boolean
  initialDescription: string
  onSubmit: (request: DescribeProblemFormRequest) => void
}) {
  const [description, setDescription] = useState(initialDescription)
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(null)
  const [submittedOnBehalf, setSubmittedOnBehalf] = useState(false)
  const [keepOriginalDescription, setKeepOriginalDescription] = useState(false)
  const [dictated, setDictated] = useState(false)

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
    <CeramicCard padding="lg" className="max-w-default">
      <form className="grid gap-5" onSubmit={submit}>
        <TextAreaField
          label="Opisz, co nie działa"
          rows={8}
          required
          minLength={descriptionMinLength}
          maxLength={descriptionMaxLength}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          hint={`Od ${descriptionMinLength} do ${descriptionMaxLength} znaków. Nie podawaj imion, nazwisk, adresów ani telefonów - i tak je usuniemy. Wpisano: ${description.length}.`}
        />

        <DictationButton onPhrase={appendPhrase} />

        <MunicipalityPicker selected={municipality} onSelect={setMunicipality} />

        <div className="grid gap-1">
          <CheckboxField
            label="Zgłaszam w czyimś imieniu"
            checked={submittedOnBehalf}
            onChange={(event) => setSubmittedOnBehalf(event.target.checked)}
          />
          <CheckboxField
            label="Zgadzam się na zapisanie opisu w oryginalnej formie (zobaczy go tylko autor i pracownik ROPS)"
            checked={keepOriginalDescription}
            onChange={(event) => setKeepOriginalDescription(event.target.checked)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <SoftButton type="submit" variant="primary" loading={pending}>
            Znajdź rozwiązania
          </SoftButton>
        </div>
      </form>
    </CeramicCard>
  )
}
