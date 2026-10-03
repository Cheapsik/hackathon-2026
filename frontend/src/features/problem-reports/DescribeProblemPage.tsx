import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import {
  usePostApiProblemReports,
  usePostApiProblemReportsProblemReportIdAnswers,
  type MunicipalityResponse,
  type ProblemReportResponse,
} from '@/api/generated/castor'
import { MunicipalityPicker } from '@/components/MunicipalityPicker'
import { ClarifyingQuestionsStep } from '@/features/problem-reports/ClarifyingQuestionsStep'
import { ProblemReportResults } from '@/features/problem-reports/ProblemReportResults'
import { TrackingTicket } from '@/features/problem-reports/TrackingTicket'
import { CheckboxField, PageContainer, PromptCard, SoftButton, StepIndicator } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSpeechInput } from '@/hooks/use-speech-input'
import { errorMessage } from '@/lib/error-message'
import { pluralPl } from '@/lib/format'

type DescribeProblemLocationState = { description?: string } | null

const descriptionMinLength = 20
const descriptionMaxLength = 3000
const steps = ['Opis', 'Pytania', 'Rozwiązania']

/**
 * Module I, "Opisz problem", where the home page field leads: the description (carried over from the home page),
 * the microphone, an optional gmina and "on behalf of someone". Sending creates the report; then come up to three
 * clarifying questions and the matches. The step list and the side column stay in place through all three steps.
 */
export function DescribeProblemPage() {
  usePageTitle('Opisz problem')

  const handedOverDescription = (useLocation().state as DescribeProblemLocationState)?.description?.trim() ?? ''
  const [report, setReport] = useState<ProblemReportResponse | null>(null)
  const createReport = usePostApiProblemReports()
  const answerQuestions = usePostApiProblemReportsProblemReportIdAnswers()
  const resultsRef = useRef<HTMLDivElement>(null)
  const currentStep = !report ? 0 : report.awaitsAnswers ? 1 : 2

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
    <PageContainer className="@container grid gap-10 pt-10 pb-16 md:pt-14 md:pb-24">
      <header className="split-aside items-end">
        <div className="grid gap-4">
          <h1>Opisz problem.</h1>
          <p className="max-w-default text-lead text-text-muted">
            Napisz własnymi słowami, co nie działa w Twojej okolicy. Podpowiemy sprawdzone innowacje z Biblioteki ROPS.
            Nie musisz zakładać konta.
          </p>
        </div>
        <StepIndicator label="Etapy zgłoszenia" steps={steps} current={currentStep} />
      </header>

      {!report && (
        <DescribeProblemForm
          pending={createReport.isPending}
          initialDescription={handedOverDescription}
          onSubmit={(request) =>
            createReport.mutate({ data: request }, { onSuccess: (response) => setReport(response.data) })
          }
          failure={
            createReport.isError &&
            errorMessage(
              createReport.error,
              descriptionLengthInvalid(createReport.variables?.data.description)
                ? {
                    400: `Sprawdź opis: musi mieć od ${descriptionMinLength} do ${descriptionMaxLength} znaków.`,
                  }
                : undefined,
            )
          }
        />
      )}

      <div ref={resultsRef} tabIndex={-1} className="outline-none">
        {report?.awaitsAnswers && (
          <div key="questions" className="split-aside animate-step-in">
            <div className="grid content-start gap-4">
              <ClarifyingQuestionsStep
                questions={report.clarifyingQuestions}
                pending={answerQuestions.isPending}
                onSubmit={submitAnswers}
              />
              <p aria-live="polite" className="text-body-sm text-text-muted">
                {answerQuestions.isPending && 'Szukam rozwiązań na podstawie Twoich odpowiedzi…'}
              </p>
              {answerQuestions.isError && (
                <p role="alert" className="rounded-control bg-danger-soft p-4 text-body-sm text-danger">
                  {errorMessage(answerQuestions.error)}
                </p>
              )}
            </div>
            <aside aria-label="Twoje zgłoszenie" className="@min-[56rem]:self-start">
              <TrackingTicket report={report} headingLevel={3} details={false} trackingLink />
            </aside>
          </div>
        )}
        {report && !report.awaitsAnswers && (
          <div key="results" className="animate-step-in">
            <ProblemReportResults report={report} headingLevel={2} trackingLink />
          </div>
        )}
      </div>
    </PageContainer>
  )
}

interface DescribeProblemFormRequest {
  description: string
  municipalityTeryt: string | null
  submittedOnBehalf: boolean
  dictated: boolean
  keepOriginalDescription: boolean
}

function descriptionLengthInvalid(description: string | null | undefined): boolean {
  const length = description?.trim().length ?? 0
  return length < descriptionMinLength || length > descriptionMaxLength
}

/** Why the description cannot be sent yet, or nothing when it can. */
function descriptionProblem(description: string): string | undefined {
  const length = description.trim().length
  if (length === 0) {
    return `Napisz kilka słów o problemie, co najmniej ${descriptionMinLength} znaków.`
  }

  if (length < descriptionMinLength) {
    return `Opis jest za krótki: ma ${length} ${pluralPl(length, 'znak', 'znaki', 'znaków')}, potrzeba co najmniej ${descriptionMinLength}.`
  }

  return undefined
}

function DescribeProblemForm({
  pending,
  initialDescription,
  onSubmit,
  failure,
}: {
  pending: boolean
  initialDescription: string
  onSubmit: (request: DescribeProblemFormRequest) => void
  /** Why the API refused the report, in words for the user. */
  failure: ReactNode
}) {
  const detailsId = useId()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [description, setDescription] = useState(initialDescription)
  const [problem, setProblem] = useState<string>()
  const [municipality, setMunicipality] = useState<MunicipalityResponse | null>(null)
  const [submittedOnBehalf, setSubmittedOnBehalf] = useState(false)
  const [keepOriginalDescription, setKeepOriginalDescription] = useState(false)
  const [dictated, setDictated] = useState(false)
  const speech = useSpeechInput({
    onTranscript: (phrase) => {
      setDictated(true)
      setProblem(undefined)
      setDescription((current) => (current ? `${current} ${phrase}` : phrase))
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const foundProblem = descriptionProblem(description)
    if (foundProblem) {
      setProblem(foundProblem)
      textAreaRef.current?.focus()
      return
    }

    onSubmit({
      description,
      municipalityTeryt: municipality?.teryt ?? null,
      submittedOnBehalf,
      dictated,
      keepOriginalDescription,
    })
  }

  return (
    <form noValidate onSubmit={submit} className="split-aside">
      <PromptCard
        size="lg"
        label="Opisz, co nie działa"
        placeholder="Np. seniorzy z naszej wsi nie mają jak dojechać do lekarza."
        value={description}
        onValueChange={(value) => {
          setDescription(value)
          setProblem(undefined)
        }}
        maxLength={descriptionMaxLength}
        error={problem}
        hint={`Od ${descriptionMinLength} do ${descriptionMaxLength} znaków. Nie podawaj imion, nazwisk, adresów ani telefonów - i tak je usuniemy. Dyktowanie działa w Chrome i Edge.`}
        voice={{ supported: speech.supported, listening: speech.listening, onToggle: speech.toggle, message: speech.error }}
        textAreaRef={textAreaRef}
      />

      <div className="grid content-start gap-6">
        <div role="group" aria-labelledby={detailsId} className="grid gap-5">
          <div className="grid gap-1">
            <p id={detailsId} className="text-body font-medium">
              Szczegóły zgłoszenia
            </p>
            <p className="text-label text-text-muted">Nieobowiązkowe. Możesz od razu szukać rozwiązań.</p>
          </div>

          <MunicipalityPicker
            selected={municipality}
            onSelect={setMunicipality}
            label="Gmina, której dotyczy problem"
            hint="Wpisz co najmniej 2 litery nazwy."
          />

          <div className="grid gap-1 border-t border-border-subtle pt-3">
            <CheckboxField
              label="Zgłaszam w czyimś imieniu"
              hint="Na przykład pomagasz sąsiadce albo podopiecznemu."
              checked={submittedOnBehalf}
              onChange={(event) => setSubmittedOnBehalf(event.target.checked)}
            />
            <CheckboxField
              label="Zgadzam się na zapisanie opisu w oryginalnej formie"
              hint="Zobaczy go tylko autor i pracownik ROPS."
              checked={keepOriginalDescription}
              onChange={(event) => setKeepOriginalDescription(event.target.checked)}
            />
          </div>
        </div>

        <div className="grid gap-3">
          <SoftButton type="submit" variant="primary" size="lg" fullWidth forward loading={pending}>
            Znajdź rozwiązania
          </SoftButton>
          <p aria-live="polite" className="text-body-sm text-text-muted">
            {pending && 'Szukam rozwiązań… To może potrwać kilka sekund.'}
          </p>
          {failure && (
            <p role="alert" className="rounded-control bg-danger-soft p-4 text-body-sm text-danger">
              {failure}
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
