
import { CeramicCard, Section } from '@/design-system'

const colorTokens: { token: string; use: string }[] = [
  { token: 'canvas', use: 'Tło strony (bg)' },
  { token: 'app', use: 'Tło aplikacji' },
  { token: 'surface-glass', use: 'Pas informacyjny, stopka (surface)' },
  { token: 'surface-glass-strong', use: 'Pola, kontrolki (surface-strong)' },
  { token: 'surface-ceramic', use: 'Główna powierzchnia, popover, karty' },
  { token: 'surface-solid', use: 'Zmiana tła sekcji, hover' },
  { token: 'chip', use: 'Aktywne tło (accent-soft)' },
  { token: 'surface-active', use: 'Akcja główna, stan aktywny (primary)' },
  { token: 'primary-hover', use: 'Akcja główna po najechaniu' },
  { token: 'text-primary', use: 'Tekst, ikony (ink)' },
  { token: 'text-muted', use: 'Opisy, etykiety (≥ 4.5:1)' },
  { token: 'text-faint', use: 'Placeholdery (≥ 4.5:1)' },
  { token: 'text-inverse', use: 'Tekst na zielonym przycisku' },
  { token: 'border-subtle', use: 'Linie, separatory (line)' },
  { token: 'border-highlight', use: 'Krawędź powierzchni (line)' },
  { token: 'border-strong', use: 'Obrys pól formularza (≥ 3:1)' },
  { token: 'accent', use: 'Wybrany element, dane' },
  { token: 'focus', use: 'Obwódka focusu' },
  { token: 'success', use: 'Sukces (tekst i ikona)' },
  { token: 'success-soft', use: 'Tło statusu sukcesu' },
  { token: 'warning', use: 'Ostrzeżenie (tekst i ikona)' },
  { token: 'warning-soft', use: 'Tło ostrzeżenia' },
  { token: 'danger', use: 'Błąd, destrukcja' },
  { token: 'danger-soft', use: 'Tło błędu' },
  { token: 'scrim', use: 'Przyciemnienie pod modalem' },
  { token: 'media', use: 'Brak zdjęcia' },
]

const typeTokens: { token: string; className: string; sample: string }[] = [
  { token: 'hero', className: 'text-hero font-medium tracking-hero', sample: 'Co w Twojej okolicy nie działa?' },
  { token: 'logo', className: 'text-logo font-semibold tracking-display', sample: 'Castor' },
  { token: 'lead', className: 'text-lead text-text-muted', sample: 'Opisz problem własnymi słowami. Castor podpowie rozwiązania.' },
  { token: 'eyebrow', className: 'text-eyebrow font-medium text-text-muted', sample: 'Małopolski Hub Innowacji Społecznych' },
  { token: 'znaki', className: 'text-section-title', sample: 'ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ' },
  { token: 'page-title', className: 'text-page-title font-medium tracking-display', sample: 'Biblioteka innowacji' },
  { token: 'value', className: 'text-value font-light tracking-display tabular', sample: '1 240' },
  { token: 'section-title', className: 'text-section-title font-medium', sample: 'Jak to działa' },
  { token: 'body', className: 'text-body', sample: 'Opisz problem w swojej okolicy, a podpowiemy rozwiązania.' },
  { token: 'body-sm', className: 'text-body-sm text-text-muted', sample: 'Pomocniczy opis pod tytułem karty.' },
  { token: 'label', className: 'text-label font-medium text-text-muted', sample: 'Rok danych: 2024' },
]

const spacingSteps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
const radiusTokens = ['control', 'button', 'card', 'panel']

const materials: { name: string; className: string; use: string }[] = [
  { name: 'surface-glass', className: 'surface-glass rounded-panel', use: 'Grupa treści' },
  { name: 'surface-glass-strong', className: 'surface-glass-strong rounded-input', use: 'Pole, kontrolka' },
  { name: 'surface-ceramic', className: 'surface-ceramic rounded-panel', use: 'Główna powierzchnia produktu' },
  { name: 'surface-floating', className: 'surface-floating rounded-button', use: 'Dock, tooltip' },
  { name: 'surface-overlay', className: 'surface-overlay rounded-card', use: 'Popover, modal' },
]

export function TokenSpecimens() {
  return (
    <>
      <Section titleAs="h3" title="Kolory" description="Nazwy semantyczne. W Tailwind: bg-…, text-…, border-… z tą nazwą.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {colorTokens.map(({ token, use }) => (
            <li key={token} className="flex items-center gap-3">
              <span
                aria-hidden
                className="size-12 shrink-0 rounded-control border border-border-subtle shadow-contact"
                style={{ background: `var(--color-${token})` }}
              />
              <span className="grid gap-1">
                <code className="font-mono text-label">{token}</code>
                <span className="text-label text-text-muted">{use}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        titleAs="h3"
        title="Typografia"
        description="Satoshi w całym interfejsie. Hierarchię budują rozmiar, waga i odstępy; tekst główny ma co najmniej 16 px, etykiety co najmniej 14 px."
      >
        <CeramicCard padding="lg" className="grid gap-4">
          {typeTokens.map(({ token, className, sample }) => (
            <div key={token} className="grid gap-1 md:grid-cols-[10rem_1fr] md:items-baseline">
              <code className="font-mono text-label text-text-muted">text-{token}</code>
              <span className={className}>{sample}</span>
            </div>
          ))}
        </CeramicCard>
      </Section>

      <Section titleAs="h3" title="Odstępy i promienie" description="Tylko skala 4–64 px. Promienie: control 10 < button i pole 14 < card 16 < panel 22. Koło tylko dla statusu i przełącznika.">
        <div className="grid gap-4 lg:grid-cols-2">
          <CeramicCard padding="lg" className="grid gap-2">
            {spacingSteps.map((step) => (
              <div key={step} className="grid grid-cols-[3rem_1fr] items-center gap-3">
                <code className="font-mono text-label text-text-muted">{step * 4}px</code>
                <span
                  aria-hidden
                  className="h-3 rounded-button bg-surface-active"
                  style={{ width: `calc(var(--spacing) * ${step})` }}
                />
              </div>
            ))}
          </CeramicCard>
          <CeramicCard padding="lg" className="grid grid-cols-3 gap-4">
            {radiusTokens.map((token) => (
              <div key={token} className="grid justify-items-center gap-2">
                <span
                  aria-hidden
                  className="size-16 border border-border-strong bg-surface-glass-strong"
                  style={{ borderRadius: `var(--radius-${token})` }}
                />
                <code className="font-mono text-label">rounded-{token}</code>
              </div>
            ))}
          </CeramicCard>
        </div>
      </Section>

      <Section titleAs="h3" title="Powierzchnie" description="Receptury powierzchni (utility w globals.css). Wszystkie nieprzezroczyste, bez blura; co najwyżej jedna warstwa cienia.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map(({ name, className, use }) => (
            <div key={name} className={`grid min-h-28 content-end gap-1 p-4 ${className}`}>
              <code className="font-mono text-label">{name}</code>
              <span className="text-label text-text-muted">{use}</span>
            </div>
          ))}
          <div className="grid min-h-28 content-end rounded-panel p-4 media-fallback">
            <span className="grid w-fit gap-1 rounded-control p-3 surface-on-media">
              <code className="font-mono text-label">surface-on-media</code>
              <span className="text-label">Kontrolki na zdjęciu</span>
            </span>
          </div>
        </div>
      </Section>
    </>
  )
}
