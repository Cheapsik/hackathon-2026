import { useCallback, useEffect, useRef, useState } from 'react'

/** The slice of the Web Speech API used here; the lib.dom typings do not include it. */
type SpeechResult = { isFinal: boolean; 0: { transcript: string } }
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<SpeechResult> }
type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition
}

function describeSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Przeglądarka nie ma dostępu do mikrofonu. Zezwól na mikrofon albo wpisz opis.'
    case 'no-speech':
      return 'Nie słyszę głosu. Spróbuj jeszcze raz albo wpisz opis.'
    case 'network':
      return 'Dyktowanie potrzebuje połączenia z internetem. Wpisz opis albo spróbuj później.'
    default:
      return 'Nie udało się rozpoznać mowy. Wpisz opis albo spróbuj jeszcze raz.'
  }
}

type UseSpeechInputOptions = {
  lang?: string
  /** Called with each finished phrase; the caller appends it to its text. */
  onTranscript: (text: string) => void
}

/**
 * Dictation through the browser's speech recognition (Chrome and Edge; other browsers report `supported: false`).
 * Never the only way to enter text — the caller always keeps its text field.
 */
export function useSpeechInput({ lang = 'pl-PL', onTranscript }: UseSpeechInputOptions) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string>()
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  })

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      return
    }

    const recognition = new Recognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) {
          onTranscriptRef.current(result[0].transcript.trim())
        }
      }
    }
    recognition.onerror = (event) => setError(describeSpeechError(event.error))
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    setError(undefined)
    recognition.start()
    setListening(true)
  }, [listening, lang])

  return { supported: getSpeechRecognition() !== undefined, listening, error, toggle }
}
