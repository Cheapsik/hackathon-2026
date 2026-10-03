import {
  BookOpen,
  Inbox,
  Lightbulb,
  Radar,
  ScrollText,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type AdminSection = {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

/** Destinations of the ROPS admin panel (module VI). */
export const adminSections: AdminSection[] = [
  {
    to: '/admin/zgloszenia',
    label: 'Skrzynka zgłoszeń',
    description: 'Nowe zgłoszenia na żywo, statusy i odpowiedzi.',
    icon: Inbox,
  },
  {
    to: '/admin/pomysly',
    label: 'Pomysły z Kreatora',
    description: 'Decyzje ROPS i wypuszczanie pomysłów jako innowacje.',
    icon: Lightbulb,
  },
  {
    to: '/admin/radar',
    label: 'Radar potrzeb',
    description: 'Trendy, białe plamy i szkice naborów.',
    icon: Radar,
  },
  {
    to: '/admin/wiedza',
    label: 'Wiedza',
    description: 'Karty innowacji, genomy i wersje „Prościej”.',
    icon: BookOpen,
  },
  {
    to: '/admin/nabory',
    label: 'Nabory',
    description: 'Otwarte i zamknięte nabory oraz wnioski.',
    icon: ScrollText,
  },
  {
    to: '/admin/uzytkownicy',
    label: 'Użytkownicy i role',
    description: 'Nadawanie ról, gmin i obszarów ekspertów.',
    icon: Users,
  },
]
