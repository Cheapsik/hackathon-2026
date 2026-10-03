import {
  Accessibility,
  GraduationCap,
  Heart,
  Smartphone,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type Suggestion = {
  /** Short label on the chip. */
  label: string
  /** What the chip puts in the field. */
  text: string
  icon: LucideIcon
}

export const suggestions: readonly Suggestion[] = [
  {
    label: 'Seniorzy nie mają jak dostać się do lekarza',
    text: 'Seniorzy nie mają jak dostać się do lekarza',
    icon: Stethoscope,
  },
  {
    label: 'Młodzi ludzie nie mają gdzie się spotykać',
    text: 'Młodzi ludzie nie mają gdzie się spotykać',
    icon: Users,
  },
  {
    label: 'Samotni seniorzy',
    text: 'Samotni seniorzy nie mają z kim spędzić czasu',
    icon: Heart,
  },
  {
    label: 'Seniorzy nie radzą sobie z cyfrowymi usługami',
    text: 'Seniorzy nie radzą sobie z cyfrowymi usługami',
    icon: Smartphone,
  },
  {
    label: 'Dzieci z małych miejscowości mają ograniczony dostęp do zajęć',
    text: 'Dzieci z małych miejscowości mają ograniczony dostęp do zajęć',
    icon: GraduationCap,
  },
  {
    label: 'Osoby z niepełnosprawnościami nie wiedzą, gdzie znaleźć dostępne usługi',
    text: 'Osoby z niepełnosprawnościami nie wiedzą, gdzie znaleźć dostępne usługi',
    icon: Accessibility,
  },
]

/** Lines the empty field cycles through as its placeholder. */
export const placeholderLines = suggestions.map((item) => `Np. ${item.text.charAt(0).toLowerCase()}${item.text.slice(1)}`)

const SHOWN = 3
const MIN_WORD = 3

/** Polish endings vary, so a typed word matches a label by its stem: the word without its last two letters. */
function stem(word: string) {
  return word.length > 5 ? word.slice(0, -2) : word
}

/**
 * The chips to show for what has been typed so far: the first few while the field is empty, then the ones that
 * share a word with the text, and none when nothing matches or the text already is a suggestion.
 */
export function suggestionsFor(typed: string): Suggestion[] {
  const text = typed.trim().toLowerCase()
  if (!text) return suggestions.slice(0, SHOWN)

  const stems = text
    .split(/\s+/)
    .filter((word) => word.length >= MIN_WORD)
    .map(stem)
  if (stems.length === 0) return []

  return suggestions
    .filter((item) => item.text.toLowerCase() !== text)
    .filter((item) => {
      const haystack = `${item.label} ${item.text}`.toLowerCase()
      return stems.some((word) => haystack.includes(word))
    })
    .slice(0, SHOWN)
}
