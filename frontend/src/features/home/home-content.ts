import type { RuledListItem } from '@/design-system'

/** The three steps of "Jak to działa" — a real sequence, so the list is numbered. */
export const steps: RuledListItem[] = [
  {
    id: 'describe',
    title: 'Opisz, co nie działa',
    description: 'Napisz albo powiedz własnymi słowami. Nie musisz zakładać konta.',
  },
  {
    id: 'match',
    title: 'Zobacz dopasowane innowacje',
    description: 'Podpowiemy sprawdzone rozwiązania z Biblioteki ROPS i wyjaśnimy, dlaczego pasują.',
  },
  {
    id: 'fit',
    title: 'Sprawdź dla swojej gminy',
    description: 'Karta dopasowania pokaże, co zostaje bez zmian, co trzeba dostosować i czego brakuje.',
  },
]

/** "Dla kogo jest Castor". Not rendered yet: it joins the page after the first screen is accepted. */
export const audiences: RuledListItem[] = [
  {
    id: 'residents',
    title: 'Mieszkańcy i organizacje',
    description: 'Zgłaszają problemy, szukają rozwiązań i testują nowe pomysły.',
  },
  {
    id: 'municipalities',
    title: 'Gminy',
    description: 'Sprawdzają na danych o gminie, czy innowacja przyjmie się u nich.',
  },
  {
    id: 'rops',
    title: 'Regionalny Ośrodek Polityki Społecznej',
    description: 'Widzi zgłoszenia na bieżąco, potrzeby w regionie i obszary bez rozwiązań.',
  },
]
