import { Fragment, useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, Mic, UserRound } from 'lucide-react'
import { primaryNavFor } from '@/components/layout/primary-nav'
import { usePageTitle } from '@/hooks/use-page-title'
import { useSession } from '@/hooks/use-session'
import { useSpeechInput } from '@/hooks/use-speech-input'
import { rynekChurchMask, rynekPhoto } from '@/lib/rynek-scene'
import { prefersReducedMotion } from './motion'
import { placeholderLines, suggestionsFor, type Suggestion } from './suggestions'
import { useCursorRing } from './use-cursor-ring'
import { useHeroMotion } from './use-hero-motion'
import { useMagnetic } from './use-magnetic'
import './krakow-above.css'

const MAX_LENGTH = 3000
/** The counter turns to a warning this close to the limit. */
const WARN_AT = MAX_LENGTH - 300
const PLACEHOLDER_EVERY_MS = 3800
const UNSUPPORTED_NOTE = 'Dyktowanie działa w Chrome i Edge. W tej przeglądarce wpisz opis w polu.'
/** Length of the entry sequence in krakow-above.css, with the last hint's stagger. */
const ENTRY_MS = 2300

/** Two sentences, one per line: what the person does, then what the system does. */
const headlineLines = [['Opisz', 'problem.'], ['Dopasujemy', 'rozwiązania.']] as const

/** Position of an element in an entry sequence, read by the stagger delays in the stylesheet. */
const step = (index: number) => ({ '--i': index }) as CSSProperties

/**
 * Home page: a cinematic still of Rynek Główny, with Castor and the problem field as layers on top.
 * Lives outside AppLayout, it brings its own header.
 */
export function KrakowAbovePage() {
  usePageTitle('Opisz problem, dopasujemy rozwiązania')

  const navigate = useNavigate()
  const session = useSession()
  const nav = primaryNavFor(session?.role)
  const rootRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string>()
  const [dictationNote, setDictationNote] = useState<string>()
  const [lineIndex, setLineIndex] = useState(0)
  const [entered, setEntered] = useState(false)
  const speech = useSpeechInput({
    onTranscript: (text) => setDescription((current) => (current ? `${current} ${text}` : text)),
  })

  useHeroMotion({ root: rootRef, photo: photoRef, wordmark: wordmarkRef })
  useCursorRing({ root: rootRef, ring: cursorRef })
  useMagnetic(submitRef)

  // Hints that appear after the entry sequence should not wait for it.
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), ENTRY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const empty = description.length === 0
  useEffect(() => {
    if (!empty || prefersReducedMotion()) return
    const timer = window.setInterval(() => setLineIndex((index) => (index + 1) % placeholderLines.length), PLACEHOLDER_EVERY_MS)
    return () => window.clearInterval(timer)
  }, [empty])

  const shown = suggestionsFor(description)
  const note =
    error ?? (speech.listening ? 'Słucham. Mów po polsku, tekst pojawi się w polu.' : (speech.error ?? dictationNote))

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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line. Not while an IME composition is open.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  function pick(suggestion: Suggestion) {
    setDescription(suggestion.text)
    setError(undefined)
    textAreaRef.current?.focus()
  }

  return (
    <div className={entered ? 'ka is-entered' : 'ka'} ref={rootRef}>
      <div className="ka-frame">
        <div className="ka-photo" ref={photoRef}>
          <div className="ka-photo-zoom">
            <ScenePlate />
            {/* The header names the service; this is the decorative title of the scene. */}
            <div className="ka-wordmark" ref={wordmarkRef} aria-hidden="true">
              <span>CASTOR</span>
            </div>
            <ScenePlate front />
          </div>
        </div>
        <div className="ka-grain" aria-hidden="true" />

        <header className="ka-top">
          <nav className="ka-nav" aria-label="Główne">
            {nav.map((item) => (
              <Link key={item.to} className="ka-nav-link" to={item.to}>
                {item.label}
              </Link>
            ))}
            <Link className="ka-nav-account" to="/logowanie" aria-label="Zaloguj się">
              <UserRound aria-hidden strokeWidth={1.75} />
            </Link>
          </nav>
        </header>

        <main className="ka-main">
          <h1 className="ka-question">
            {headlineLines.map((words, line) => (
              <span key={line} className="ka-line">
                {words.map((word, index) => (
                  <Fragment key={word}>
                    <span className="ka-word">
                      <span style={step(line * 2 + index)}>{word}</span>
                    </span>{' '}
                  </Fragment>
                ))}
              </span>
            ))}
          </h1>

          <form className="ka-composer" onSubmit={handleSubmit} noValidate>
            <div className="ka-composer-row">
              <div className="ka-input">
                <label className="ka-sr" htmlFor="opis-problemu">
                  Opisz problem w Twojej okolicy
                </label>
                {empty && (
                  <span key={lineIndex} className="ka-input-hint" aria-hidden="true">
                    {placeholderLines[lineIndex]}
                  </span>
                )}
                <textarea
                  id="opis-problemu"
                  ref={textAreaRef}
                  rows={1}
                  maxLength={MAX_LENGTH}
                  value={description}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={note ? 'opis-problemu-uwagi' : undefined}
                  onKeyDown={handleKeyDown}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    setError(undefined)
                    setDictationNote(undefined)
                  }}
                />
              </div>

              {/* Always shown. Where the browser has no speech recognition, pressing it says what to do instead. */}
              <button
                type="button"
                className="ka-dictate"
                aria-pressed={speech.supported ? speech.listening : undefined}
                aria-label={speech.listening ? 'Zatrzymaj dyktowanie' : 'Dyktuj opis głosem'}
                onClick={speech.supported ? speech.toggle : () => setDictationNote(UNSUPPORTED_NOTE)}
              >
                <Mic aria-hidden strokeWidth={1.7} />
              </button>

              <button type="submit" className="ka-submit" ref={submitRef}>
                <span>Znajdź rozwiązania</span>
                <ArrowRight aria-hidden strokeWidth={2} />
              </button>
            </div>

            {(note || description.length > 0) && (
              <div className="ka-composer-meta">
                <p id="opis-problemu-uwagi" className={error ? 'ka-composer-note is-error' : 'ka-composer-note'} aria-live="polite">
                  {note}
                </p>
                {description.length > 0 && (
                  <p className={description.length >= WARN_AT ? 'ka-counter is-warning' : 'ka-counter'}>
                    {description.length} / {MAX_LENGTH}
                  </p>
                )}
              </div>
            )}
          </form>

          {shown.length > 0 && (
            <ul className="ka-examples" aria-label="Podpowiedzi">
              {shown.map((suggestion, index) => (
                <li key={suggestion.label} style={step(index)}>
                  <button type="button" onClick={() => pick(suggestion)}>
                    <suggestion.icon aria-hidden strokeWidth={1.7} />
                    {suggestion.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      <div className="ka-cursor" ref={cursorRef} aria-hidden="true">
        <span className="ka-cursor-dot" />
      </div>
    </div>
  )
}

/**
 * The graded photo. Drawn twice: under the wordmark, and over it cut down to the church by the mask, so the towers
 * stand in front of the letters. Both copies share one transform, which keeps the cut aligned at every frame.
 */
function ScenePlate({ front = false }: { front?: boolean }) {
  return (
    <div
      className={front ? 'ka-plate ka-plate-front' : 'ka-plate'}
      style={front ? { maskImage: rynekChurchMask, WebkitMaskImage: rynekChurchMask } : undefined}
      aria-hidden="true"
    >
      <img src={rynekPhoto} alt="" decoding="async" />
      <div className="ka-grade" />
    </div>
  )
}
