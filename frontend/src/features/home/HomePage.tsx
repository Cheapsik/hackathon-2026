import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { BandSection, PromptCard, RuledList, StartTemplate } from '@/design-system'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSpeechInput } from '@/hooks/use-speech-input'
import { steps } from './home-content'

export function HomePage() {
  usePageTitle('Strona główna')

  const navigate = useNavigate()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string>()
  const speech = useSpeechInput({
    onTranscript: (text) => setDescription((current) => (current ? `${current} ${text}` : text)),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = description.trim()

    if (!trimmed) {
      setError('Napisz kilka słów o problemie, żeby znaleźć rozwiązania.')
      textAreaRef.current?.focus()
      return
    }

    void navigate('/opisz-problem', { state: { description: trimmed } })
  }

  return (
    <StartTemplate
      eyebrow="Małopolski Hub Innowacji Społecznych"
      title="Co w Twojej okolicy nie działa?"
      lead="Opisz problem własnymi słowami. Castor podpowie sprawdzone rozwiązania z Biblioteki ROPS i wyjaśni, dlaczego pasują."
      tool={
        <form onSubmit={handleSubmit} noValidate>
          <PromptCard
            label="Opisz, co nie działa"
            placeholder="Np. w naszej wsi nie ma dojazdu do lekarza"
            submitLabel="Znajdź rozwiązania"
            value={description}
            onValueChange={(value) => {
              setDescription(value)
              setError(undefined)
            }}
            error={error}
            hint="Bez konta. Po wysłaniu dostajesz kod, którym sprawdzisz status zgłoszenia."
            textAreaRef={textAreaRef}
            voice={{
              supported: speech.supported,
              listening: speech.listening,
              onToggle: speech.toggle,
              message: speech.error,
            }}
          />
        </form>
      }
      band={
        <BandSection title="Jak to działa">
          <RuledList numbered items={steps} />
        </BandSection>
      }
    />
  )
}
