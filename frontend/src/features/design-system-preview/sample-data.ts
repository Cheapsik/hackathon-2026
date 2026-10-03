import { BookOpen, Heart, House, Sprout, Users } from 'lucide-react'
import type { ChartPoint, MediaRailItem, OrbitCategory } from '@/design-system'

/*
 * Neutral, clearly fictional sample content for the design-system preview only ("Gmina Przykładowa",
 * invented innovations). Never import this into feature code - real screens use real data.
 */

export const sampleCategories: OrbitCategory[] = [
  { id: 'wsparcie', label: 'Wsparcie', icon: Users },
  { id: 'rodzina', label: 'Rodzina', icon: Heart },
  { id: 'dom', label: 'Dom', icon: House },
  { id: 'edukacja', label: 'Edukacja', icon: BookOpen },
  { id: 'wspolnota', label: 'Wspólnota', icon: Sprout },
]

export const sampleCategoryContent: Record<string, { meta: string; title: string; description: string }> = {
  wsparcie: {
    meta: 'Etap: przetestowane · 12 gmin',
    title: 'Sąsiedzka sieć wsparcia seniorów',
    description: 'Wolontariusze z najbliższej okolicy pomagają w zakupach, wizytach u lekarza i codziennych sprawach.',
  },
  rodzina: {
    meta: 'Etap: prototyp · 3 gminy',
    title: 'Klub rodzica przy szkole',
    description: 'Spotkania, na których rodzice wymieniają się doświadczeniami i dostają wsparcie specjalistów.',
  },
  dom: {
    meta: 'Etap: gotowe · 7 gmin',
    title: 'Mieszkanie treningowe',
    description: 'Mieszkanie, w którym młodzi dorośli uczą się samodzielności pod okiem opiekuna.',
  },
  edukacja: {
    meta: 'Etap: pomysł',
    title: 'Korepetycje międzypokoleniowe',
    description: 'Seniorzy uczą dzieci, a dzieci pomagają seniorom w obsłudze telefonu i komputera.',
  },
  wspolnota: {
    meta: 'Etap: przetestowane · 5 gmin',
    title: 'Ogród społeczny na osiedlu',
    description: 'Wspólna grządka, która łączy sąsiadów w różnym wieku i ożywia przestrzeń między blokami.',
  },
}

export const sampleMedia: MediaRailItem[] = [
  { id: 'film', label: 'Film' },
  { id: 'materialy', label: 'Materiały' },
  { id: 'karta', label: 'Karta PDF' },
  { id: 'zasady', label: 'Zasady' },
]

export const sampleMonthlyReports: ChartPoint[] = [
  { label: 'sty', value: 12 },
  { label: 'lut', value: 18 },
  { label: 'mar', value: 15 },
  { label: 'kwi', value: 22 },
  { label: 'maj', value: 31 },
  { label: 'cze', value: 27 },
  { label: 'lip', value: 35 },
  { label: 'sie', value: 41 },
]

export type SampleInnovation = { id: string; title: string; area: string; stage: string; municipalities: number }

export const sampleInnovations: SampleInnovation[] = [
  { id: '1', title: 'Sąsiedzka sieć wsparcia seniorów', area: 'Starzenie się', stage: 'Przetestowane', municipalities: 12 },
  { id: '2', title: 'Klub rodzica przy szkole', area: 'Rodzina', stage: 'Prototyp', municipalities: 3 },
  { id: '3', title: 'Mieszkanie treningowe', area: 'Usamodzielnienie', stage: 'Gotowe', municipalities: 7 },
  { id: '4', title: 'Korepetycje międzypokoleniowe', area: 'Edukacja', stage: 'Pomysł', municipalities: 0 },
  { id: '5', title: 'Ogród społeczny na osiedlu', area: 'Wspólnota', stage: 'Przetestowane', municipalities: 5 },
  { id: '6', title: 'Punkt porad dla opiekunów', area: 'Zdrowie', stage: 'Gotowe', municipalities: 9 },
]

export const sampleAreas = [
  { value: 'starzenie', label: 'Starzenie się', count: 14 },
  { value: 'rodzina', label: 'Rodzina', count: 9 },
  { value: 'zdrowie', label: 'Zdrowie', count: 11 },
  { value: 'edukacja', label: 'Edukacja', count: 6 },
  { value: 'wspolnota', label: 'Wspólnota', count: 8 },
]

export const sampleMunicipalities = [
  { value: 'przykladowa', label: 'Gmina Przykładowa' },
  { value: 'wzorcowa', label: 'Gmina Wzorcowa' },
  { value: 'testowa', label: 'Gmina Testowa' },
]
