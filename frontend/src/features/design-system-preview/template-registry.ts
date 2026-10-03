import type { ComponentType } from 'react'
import {
  AuthExample,
  CollectionExample,
  FormFlowExample,
  ImmersiveDetailExample,
  OverviewExample,
  SettingsExample,
  StartExample,
  TransactionExample,
} from './TemplateExamples'

export type TemplatePreview = {
  id: string
  label: string
  /** Extra states the example can show through `?stan=` (the default state comes first). */
  states: { value: string; label: string }[]
  Component: ComponentType<{ state?: string }>
}

const readyOnly = [{ value: 'ready', label: 'Gotowe' }]

export const templatePreviews: TemplatePreview[] = [
  {
    id: 'start',
    label: 'Start',
    states: [
      { value: 'ready', label: 'Pusty' },
      { value: 'filled', label: 'Wypełniony' },
      { value: 'error', label: 'Błąd' },
    ],
    Component: StartExample,
  },
  { id: 'immersive-detail', label: 'ImmersiveDetail', states: readyOnly, Component: ImmersiveDetailExample },
  { id: 'overview', label: 'Overview', states: readyOnly, Component: OverviewExample },
  {
    id: 'collection',
    label: 'Collection',
    states: [
      { value: 'ready', label: 'Wyniki' },
      { value: 'loading', label: 'Ładowanie' },
      { value: 'empty', label: 'Pusto' },
      { value: 'error', label: 'Błąd' },
    ],
    Component: CollectionExample,
  },
  {
    id: 'form-flow',
    label: 'FormFlow',
    states: [
      { value: 'ready', label: 'Pusty' },
      { value: 'error', label: 'Błędy' },
    ],
    Component: FormFlowExample,
  },
  {
    id: 'transaction',
    label: 'Transaction',
    states: [
      { value: 'edit', label: 'Edycja' },
      { value: 'confirm', label: 'Potwierdzenie' },
      { value: 'success', label: 'Sukces' },
    ],
    Component: TransactionExample,
  },
  { id: 'settings', label: 'Settings', states: readyOnly, Component: SettingsExample },
  {
    id: 'auth',
    label: 'Auth',
    states: [
      { value: 'ready', label: 'Pusty' },
      { value: 'error', label: 'Błąd' },
    ],
    Component: AuthExample,
  },
]
