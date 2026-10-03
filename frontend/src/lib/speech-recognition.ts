/**
 * The Web Speech API as far as dictation needs it. Only Chrome and Edge ship it (as webkitSpeechRecognition in
 * Chrome), and TypeScript's DOM library does not describe it, hence these few declarations.
 */
export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export interface SpeechRecognitionResultEventLike {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

export function speechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}
