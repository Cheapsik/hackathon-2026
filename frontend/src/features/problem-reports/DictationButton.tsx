import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { SoftButton } from '@/design-system'
import { speechRecognitionConstructor, type SpeechRecognitionLike } from '@/lib/speech-recognition'

interface DictationButtonProps {
  /** Called with each finished phrase; the form appends it to the description. */
  onPhrase: (phrase: string) => void
}

/**
 * The microphone of "Opisz problem": Polish dictation with the Web Speech API. Always next to the text field, never
 * instead of it - in a browser without the API it only says so.
 */
export function DictationButton({ onPhrase }: DictationButtonProps) {
  const [listening, setListening] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const Recognition = speechRecognitionConstructor()

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  if (!Recognition) {
    return (
      <p className="text-label text-text-muted">
        Dyktowanie głosem działa w przeglądarkach Chrome i Edge. Tutaj wpisz opis w polu tekstowym.
      </p>
    )
  }

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new Recognition!()
    recognition.lang = 'pl-PL'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        if (result.isFinal) {
          onPhrase(result[0].transcript.trim())
        }
      }
    }
    recognition.onerror = (event) => {
      setFailure(event.error === 'not-allowed' ? 'Przeglądarka nie ma dostępu do mikrofonu.' : 'Dyktowanie przerwało się. Spróbuj ponownie.')
    }
    recognition.onend = () => setListening(false)

    setFailure(null)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div className="grid justify-items-start gap-2">
      <SoftButton onClick={toggle} aria-pressed={listening} icon={listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}>
        {listening ? 'Zatrzymaj dyktowanie' : 'Dyktuj głosem'}
      </SoftButton>
      <p className="text-label text-text-muted">Mikrofon działa w Chrome i Edge. Tekst możesz zawsze poprawić w polu powyżej.</p>
      <p className="text-body-sm font-medium empty:hidden">
        <output>{listening ? 'Słucham… Mów wyraźnie, po polsku.' : ''}</output>
      </p>
      {failure && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-body-sm text-danger">
          {failure}
        </p>
      )}
    </div>
  )
}
